import clsx from "clsx";
import { AirVent, Brush, Bug, SprayCan, Wrench, Zap } from "lucide-react";

const SERVICE_ICONS = {
  "AC Repair": AirVent,
  "Deep Cleaning": SprayCan,
  Plumbing: Wrench,
  Electrical: Zap,
  "Maid Service": Brush,
  "Pest Control": Bug,
};

// The service's icon on a quiet tile, so a list of jobs can be scanned by
// trade before reading a word.
export function ServiceIcon({ service, size = 24, className }) {
  const Icon = SERVICE_ICONS[service] ?? Wrench;
  return (
    <span
      aria-hidden="true"
      className={clsx("flex shrink-0 items-center justify-center rounded-btn bg-canvas text-text-secondary", className)}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.55)} />
    </span>
  );
}

// Icon + name, for table cells and summaries.
export function ServiceLabel({ service, className }) {
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <ServiceIcon service={service} size={22} />
      <span>{service}</span>
    </span>
  );
}
