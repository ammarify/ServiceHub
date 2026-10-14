import clsx from "clsx";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatDateTime } from "../../lib/formatters";

const EVENT_LABELS = {
  created: "Booking created",
  assigned: "Provider assigned",
  reassigned: "Provider reassigned",
  started: "Service started",
  completed: "Service completed",
  cancelled: "Booking cancelled",
  rescheduled: "Booking rescheduled",
  updated: "Details updated",
};

function dotClass(event) {
  if (event === "completed") return "bg-success";
  if (event === "cancelled") return "bg-danger";
  if (event === "reassigned" || event === "rescheduled") return "bg-warning";
  return "bg-text-secondary";
}

// Rescheduling notes carry ISO timestamps; show them in the viewer's time.
function readableNote(entry) {
  if (!entry.note) return null;
  if (entry.event === "rescheduled") {
    const [from, to] = entry.note.replace("Moved from ", "").split(" to ");
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime())) {
      return `Moved from ${formatDateTime(fromDate)} to ${formatDateTime(toDate)}`;
    }
  }
  return entry.note;
}

export function BookingTimelineCard({ timeline, isLoading }) {
  // Newest last, as it happened.
  const entries = [...timeline].sort((a, b) => new Date(a.at) - new Date(b.at));

  return (
    <Card>
      <div className="text-[15px] font-semibold text-text-primary">Timeline</div>

      <ol className="mt-4 flex flex-col">
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="flex gap-3 pb-6 last:pb-0">
                <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="mt-2 h-3 w-24" />
                </div>
              </li>
            ))
          : entries.map((entry, index) => {
              const note = readableNote(entry);
              return (
                <li key={`${entry.event}-${entry.at}-${index}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={clsx("mt-1 h-2 w-2 shrink-0 rounded-full", dotClass(entry.event))} />
                    {index < entries.length - 1 && <span className="w-px flex-1 bg-border" />}
                  </div>
                  <div className={index < entries.length - 1 ? "pb-6" : ""}>
                    <div className="text-[13px] text-text-primary">{EVENT_LABELS[entry.event] ?? entry.event}</div>
                    {note && <div className="mt-0.5 text-[12px] text-text-secondary">{note}</div>}
                    <div className="font-data mt-0.5 text-[11px] text-text-secondary">
                      {formatDateTime(entry.at)}
                      {entry.actor ? ` · ${entry.actor}` : ""}
                    </div>
                  </div>
                </li>
              );
            })}
      </ol>
    </Card>
  );
}
