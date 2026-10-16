import { Card } from "./ui/Card";
import { Skeleton } from "./ui/Skeleton";

const STATUS_LABELS = {
  completed: "Completed",
  in_progress: "In Progress",
  assigned: "Assigned",
  pending: "Pending",
  cancelled: "Cancelled",
};

const STATUS_BAR_CLASSES = {
  completed: "bg-success",
  in_progress: "bg-info",
  assigned: "bg-info",
  pending: "bg-warning",
  cancelled: "bg-danger",
};

export function BookingsByStatusCard({ data, isLoading, periodLabel }) {
  const maxCount = Math.max(...data.map((entry) => entry.count), 1);
  const total = data.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Card className="flex flex-col">
      <div className="text-[15px] font-semibold text-text-primary">Bookings by status</div>
      {periodLabel && <div className="mt-0.5 text-[12px] text-text-secondary">Scheduled {periodLabel.toLowerCase()}</div>}

      <div className="mt-4 flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-4 w-full" />)
        ) : total === 0 ? (
          <p className="py-6 text-center text-[13px] text-text-secondary">No bookings scheduled in this period.</p>
        ) : (
          data.map(({ status, count }) => (
            <div key={status} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-[13px] text-text-secondary">{STATUS_LABELS[status]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                <div
                  className={`h-full rounded-full ${STATUS_BAR_CLASSES[status]}`}
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <span className="font-data w-6 shrink-0 text-right text-[13px] text-text-primary">{count}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
