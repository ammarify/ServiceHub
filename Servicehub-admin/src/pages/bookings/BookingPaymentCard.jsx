import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { formatUSD, relativeTime } from "../../lib/formatters";

export function BookingPaymentCard({ booking, isLoading }) {
  const summary = booking?.refundSummary;
  const refunds = booking?.refunds ?? [];

  return (
    <Card>
      <div className="text-[15px] font-semibold text-text-primary">Payment</div>

      <div className="mt-4 flex flex-col gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-40" />
          </>
        ) : (
          <>
            <div className="font-data text-[18px] font-semibold text-text-primary">{formatUSD(booking.amount)}</div>
            <div className="text-[13px] text-text-secondary">{booking.address}</div>

            {summary && (summary.approvedTotal > 0 || summary.pendingTotal > 0) && (
              <div className="grid grid-cols-3 gap-2 rounded-card border border-border p-3 text-[12px]">
                <div>
                  <div className="text-text-secondary">Refunded</div>
                  <div className="font-data text-text-primary">{formatUSD(summary.approvedTotal)}</div>
                </div>
                <div>
                  <div className="text-text-secondary">Pending</div>
                  <div className="font-data text-text-primary">{formatUSD(summary.pendingTotal)}</div>
                </div>
                <div>
                  <div className="text-text-secondary">Refundable</div>
                  <div className="font-data text-text-primary">{formatUSD(summary.refundable)}</div>
                </div>
              </div>
            )}

            {refunds.length > 0 && (
              <div>
                <div className="mb-1 text-[12px] text-text-secondary">Refund requests</div>
                <div className="flex flex-col">
                  {refunds.map((refund) => (
                    <Link
                      key={refund._id}
                      to={`/refunds?refund=${refund._id}`}
                      className="flex items-center gap-2 border-b border-border py-2 text-[13px] last:border-0 hover:bg-canvas"
                    >
                      <span className="font-data w-12 shrink-0 text-text-secondary">{refund.code}</span>
                      <span className="font-data flex-1 text-text-primary">{formatUSD(refund.amount)}</span>
                      <StatusBadge status={refund.status} />
                      <span className="font-data w-14 shrink-0 text-right text-[11px] text-text-secondary">
                        {relativeTime(refund.createdAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
