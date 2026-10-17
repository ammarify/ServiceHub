import { BadgeCheck, Radar, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { Avatar } from "../components/ui/Avatar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { TypingDots } from "../components/ui/TypingDots";

const FEATURES = [
  { icon: Radar, text: "Live bookings and provider availability" },
  { icon: Sparkles, text: "AI drafts replies and checks refund policy" },
  { icon: UsersRound, text: "Every role sees exactly what its job needs" },
];

// A still life of the product: a live ticket, the Copilot's verdict on it and
// the booking it's about. Decorative, so hidden from assistive technology.
function ProductPreview() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-[340px] w-full max-w-[460px] select-none">
      <div className="absolute left-0 top-0 w-[320px] rounded-card border border-border bg-surface p-4 shadow-pop">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-[13px] font-semibold text-text-primary">Cleaner cancelled twice</span>
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-success">
            <span className="animate-live h-1.5 w-1.5 rounded-full bg-success" />
            Live
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-secondary">
          <span className="font-data">TK-232</span>
          <span>Emily Johnson</span>
        </div>
        <div className="mt-3 rounded-card rounded-tl-none border border-border bg-canvas px-3 py-2 text-[12px] leading-relaxed text-text-primary">
          My cleaner cancelled twice already. Please send someone reliable.
        </div>
        <div className="mt-2.5 flex items-center gap-2 text-[11px] text-text-secondary">
          <TypingDots className="text-accent" />
          Madison is replying
        </div>
      </div>

      <div className="absolute right-0 top-[138px] w-[250px] rounded-card border border-border bg-surface p-4 shadow-pop">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent">
          <Sparkles size={12} />
          AI Copilot
        </div>
        <div className="mt-2.5 text-[11px] text-text-secondary">Refund eligibility</div>
        <div className="mt-0.5 text-[15px] font-semibold text-text-primary">
          Eligible, <span className="font-data">70%</span>
        </div>
        <div className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-text-secondary">
          <ShieldCheck size={12} className="mt-px shrink-0 text-success" />
          Capped by policy, Section 4
        </div>
      </div>

      <div className="absolute left-6 top-[246px] w-[290px] rounded-card border border-border bg-surface p-4 shadow-pop">
        <div className="flex items-center justify-between">
          <span className="font-data text-[12px] text-text-secondary">BK-4853</span>
          <StatusBadge status="assigned" />
        </div>
        <div className="mt-2.5 flex items-center gap-2.5">
          <Avatar name="Crystal Howard" size={30} />
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[13px] font-medium text-text-primary">
              Crystal Howard
              <BadgeCheck size={13} className="text-success" />
            </div>
            <div className="text-[11px] text-text-secondary">Maid service, Saturday 2:45 PM</div>
          </div>
          <span className="font-data ml-auto text-[13px] font-semibold text-text-primary">$135</span>
        </div>
      </div>
    </div>
  );
}

export function AuthBrandPanel() {
  return (
    <div className="relative hidden flex-1 overflow-hidden md:flex md:items-center md:justify-center">
      <svg className="pointer-events-none absolute inset-0 h-full w-full text-border" aria-hidden="true">
        <defs>
          <pattern id="auth-dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-dot-grid)" />
      </svg>

      <div className="relative flex w-full max-w-[520px] flex-col gap-10 px-10 py-16 lg:px-12">
        <div className="flex flex-col gap-3">
          <h2 className="text-balance text-[22px] font-semibold leading-snug text-text-primary">
            Every booking, every conversation, every decision in one place.
          </h2>
          <p className="max-w-[440px] text-[13px] leading-relaxed text-text-secondary">
            Your team watches bookings and support as they happen, with an AI copilot that reads each ticket
            and checks it against your refund policy before anyone replies.
          </p>
        </div>

        <div className="hidden lg:block">
          <ProductPreview />
        </div>

        <ul className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:gap-x-6">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2 text-[12px] text-text-secondary">
              <Icon size={14} className="shrink-0 text-accent" />
              {text}
            </li>
          ))}
        </ul>

        <p className="text-[12px] text-text-secondary">© 2026 ServiHub, internal operations platform</p>
      </div>
    </div>
  );
}
