const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
});

const usdWholeFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const usdCentsFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUSD(amount) {
  const value = Number(amount) || 0;
  return Number.isInteger(value) ? usdWholeFormatter.format(value) : usdCentsFormatter.format(value);
}

export function formatDate(date) {
  return dateFormatter.format(new Date(date));
}

export function formatDateTime(date) {
  return dateTimeFormatter.format(new Date(date));
}

export function formatTime(date) {
  return timeFormatter.format(new Date(date));
}

export function formatShortDate(date) {
  return shortDateFormatter.format(new Date(date));
}

// "2026-10-14" (a calendar day from the API, already in the viewer's zone)
// -> "Oct 14". Parsed as a local date: new Date("2026-10-14") would mean UTC
// midnight and show the previous day anywhere west of Greenwich.
export function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateKey(key) {
  return shortDateFormatter.format(parseDateKey(key));
}

const RELATIVE_UNITS = [
  { unit: "y", ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: "mo", ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: "d", ms: 1000 * 60 * 60 * 24 },
  { unit: "h", ms: 1000 * 60 * 60 },
  { unit: "m", ms: 1000 * 60 },
];

export function relativeTime(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const isFuture = diffMs < 0;
  const absMs = Math.abs(diffMs);

  for (const { unit, ms } of RELATIVE_UNITS) {
    if (absMs >= ms) {
      const value = Math.floor(absMs / ms);
      return isFuture ? `in ${value}${unit}` : `${value}${unit} ago`;
    }
  }
  return "just now";
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}%`;
}

export function initials(name) {
  return (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

// "in_progress" -> "In progress"
export function humanize(value) {
  const text = String(value ?? "").replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Value for <input type="datetime-local"> in the viewer's local time.
export function toDateTimeInputValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}
