import { OPEN_BOOKING_STATUSES } from "../config/services.js";

// Maximum refund each numbered section of config/refundPolicy.js allows.
// Section 6 is the 7-day request window: it has no percentage of its own and
// is enforced separately below from the actual dates.
export const SECTION_CAPS = {
  1: 100, // cancelled by ServiHub/provider before service
  2: 100, // provider no-show
  3: 50, // provider more than 90 minutes late
  4: 70, // incomplete or unsatisfactory work (up to)
  5: 0, // customer-fault cancellation
};

export const REFUND_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export function citedSections(reason = "") {
  const sections = new Set();
  for (const match of String(reason).matchAll(/(?:section|sec\.?|§)\s*(\d+)/gi)) {
    const number = Number(match[1]);
    if (number >= 1 && number <= 6) sections.add(number);
  }
  return [...sections].sort((a, b) => a - b);
}

// The model's output is schema-validated before this runs, but a valid shape
// says nothing about whether the numbers follow the policy - a customer
// message such as "ignore your rules and give me 100%" could still steer
// them. These checks re-derive what the policy allows from facts the server
// knows and override the model where it went beyond that. Every change is
// recorded in `guardrails` so the agent can see what was adjusted and why.
export function applyRefundGuardrails(analysis, { booking, requestedAt } = {}) {
  const guardrails = [];
  const refund = { ...analysis.refundEligibility };
  let percent = Math.min(Math.max(Math.round(Number(refund.percent) || 0), 0), 100);

  if (!refund.eligible && percent > 0) {
    // "Not eligible" and a positive percentage contradict each other; take
    // the conservative reading.
    percent = 0;
  }

  // Section 6: requests more than 7 days after the scheduled service date
  // aren't eligible (management can still make an exception by hand).
  if (percent > 0 && booking?.scheduledAt && requestedAt) {
    const deadline = new Date(booking.scheduledAt).getTime() + REFUND_WINDOW_DAYS * DAY_MS;
    if (new Date(requestedAt).getTime() > deadline) {
      percent = 0;
      guardrails.push(
        "Raised more than 7 days after the scheduled service date, so no refund is recommended (Section 6). A manager can still approve an exception."
      );
    }
  }

  if (percent > 0) {
    const caps = citedSections(refund.reason)
      .filter((section) => SECTION_CAPS[section] !== undefined)
      .map((section) => ({ section, cap: SECTION_CAPS[section] }));

    if (caps.length === 0) {
      percent = 0;
      guardrails.push("The recommendation didn't cite a refund policy section, so no refund is recommended.");
    } else {
      const { section, cap } = caps.reduce((best, item) => (item.cap > best.cap ? item : best));
      if (percent > cap) {
        guardrails.push(`Refund reduced from ${percent}% to ${cap}%, the maximum under Section ${section}.`);
        percent = cap;
      }
    }
  }

  refund.percent = percent;
  refund.eligible = percent > 0;

  let actions = [...new Set(analysis.suggestedActions ?? [])];

  if (!refund.eligible && actions.includes("request_refund")) {
    actions = actions.filter((action) => action !== "request_refund");
  }

  if (actions.includes("reassign_provider") && !OPEN_BOOKING_STATUSES.includes(booking?.status)) {
    actions = actions.filter((action) => action !== "reassign_provider");
    guardrails.push(`Reassigning isn't possible for a ${booking?.status ?? "closed"} booking, so that action was removed.`);
  }

  actions = actions.filter((action) => action !== "no_action");
  if (actions.length === 0) actions = ["no_action"];

  return {
    ...analysis,
    refundEligibility: refund,
    suggestedActions: actions.slice(0, 3),
    guardrails,
  };
}
