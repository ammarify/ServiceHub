import { Link } from "react-router-dom";
import { formatUSD, relativeTime } from "../lib/formatters";
import { Card } from "./ui/Card";
import { Skeleton } from "./ui/Skeleton";

export function PendingRefundsCard({ refunds, isLoading }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-semibold text-text-primary">Pending refunds</div>
        <Link to="/refunds" className="text-[13px] text-accent hover:underline">
          View all
        </Link>
      </div>

      <div className="mt-2 flex flex-col">
        {isLoading ? (
          Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="ml-auto h-3 w-14" />
            </div>
          ))
        ) : refunds.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-text-secondary">No refunds waiting for a decision.</p>
        ) : (
          refunds.map((refund) => (
            <Link
              key={refund._id}
              to={`/refunds?refund=${refund._id}`}
              className="flex items-center gap-3 border-b border-border py-2.5 text-[13px] last:border-0 hover:bg-canvas"
            >
              <span className="font-data w-14 shrink-0 text-text-secondary">{refund.code}</span>
              <span className="min-w-0 flex-1 truncate text-text-primary">
                {refund.booking?.customer?.name ?? "Unknown"}
                <span className="text-text-secondary"> · {refund.reason}</span>
              </span>
              <span className="font-data w-16 shrink-0 text-right text-text-primary">{formatUSD(refund.amount)}</span>
              <span className="font-data w-14 shrink-0 text-right text-text-secondary">
                {relativeTime(refund.createdAt)}
              </span>
            </Link>
          ))
        )}
      </div>
    </Card>
  );
}
