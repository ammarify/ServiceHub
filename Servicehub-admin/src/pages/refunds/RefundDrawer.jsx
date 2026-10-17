import { CircleCheck, CircleX } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DetailField } from "../../components/ui/DetailField";
import { Drawer } from "../../components/ui/Drawer";
import { FormField } from "../../components/ui/FormField";
import { QueryError } from "../../components/ui/QueryError";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Textarea } from "../../components/ui/Textarea";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useDecideRefund, useRefund } from "../../hooks/useRefunds";
import { errorMessage } from "../../lib/api";
import { formatDateTime, formatUSD, relativeTime } from "../../lib/formatters";
import { can } from "../../lib/permissions";

function RefundDrawerSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function RefundDrawer({ refundId, open, onClose, onDecided }) {
  const { user } = useAuth();
  const toast = useToast();
  const [confirmAction, setConfirmAction] = useState(null);
  const [note, setNote] = useState("");
  const [decisionError, setDecisionError] = useState("");

  const { data: refund, isLoading, isError, error, refetch } = useRefund(refundId);
  const decideMutation = useDecideRefund();
  const notFound = error?.response?.status === 404;

  const canDecide = can(user, "refund.approve");

  function openConfirm(action) {
    setNote("");
    setDecisionError("");
    setConfirmAction(action);
  }

  function handleConfirm() {
    if (!refund) return;
    const decision = confirmAction === "approve" ? "approved" : "rejected";
    setDecisionError("");
    decideMutation.mutate(
      { id: refund._id, decision, note: note.trim() || undefined },
      {
        onSuccess: (updated) => {
          setConfirmAction(null);
          toast.success(`Refund ${updated.code} ${decision}.`);
          onDecided?.(updated._id);
        },
        onError: (err) => setDecisionError(errorMessage(err, "Couldn't record this decision.")),
      }
    );
  }

  return (
    <>
      <Drawer open={open} onClose={onClose} title="Refund request">
        {isError ? (
          <QueryError
            message={notFound ? "This refund request doesn't exist." : "Couldn't load this refund."}
            onRetry={notFound ? undefined : refetch}
          />
        ) : isLoading || !refund ? (
          <RefundDrawerSkeleton />
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-data text-[15px] font-semibold text-text-primary">{refund.code}</span>
                <StatusBadge status={refund.status} />
              </div>
              <div className="font-data mt-1 text-[18px] font-semibold text-text-primary">{formatUSD(refund.amount)}</div>
            </div>

            <DetailField label="Reason">{refund.reason}</DetailField>

            {refund.booking && (
              <div className="rounded-card border border-border p-3">
                <div className="text-[12px] text-text-secondary">Linked booking</div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <div>
                    <Link to={`/bookings/${refund.booking._id}`} className="font-data text-[13px] text-accent hover:underline">
                      {refund.booking.code}
                    </Link>
                    <div className="mt-0.5 text-[13px] text-text-primary">
                      {refund.booking.service} · {refund.booking.customer?.name ?? "Unknown"}
                    </div>
                    <div className="font-data mt-0.5 text-[12px] text-text-secondary">
                      Paid {formatUSD(refund.booking.amount)}
                    </div>
                  </div>
                  <StatusBadge status={refund.booking.status} />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <DetailField label="Requested By">{refund.requestedBy?.name ?? "Unknown"}</DetailField>
              <DetailField label="Requested" mono>
                {formatDateTime(refund.createdAt)} · {relativeTime(refund.createdAt)}
              </DetailField>
              {refund.decidedBy && <DetailField label="Decided By">{refund.decidedBy.name}</DetailField>}
              {refund.decidedAt && (
                <DetailField label="Decided" mono>
                  {formatDateTime(refund.decidedAt)}
                </DetailField>
              )}
              {refund.decisionNote && <DetailField label="Decision note">{refund.decisionNote}</DetailField>}
            </div>

            <div>
              <div className="mb-2 text-[13px] font-semibold text-text-primary">Decision</div>
              {refund.status !== "pending" ? (
                <p className="text-[13px] text-text-secondary">
                  This request has already been {refund.status}
                  {refund.decidedBy ? ` by ${refund.decidedBy.name}` : ""}.
                </p>
              ) : canDecide ? (
                <div className="flex gap-2">
                  <Button variant="primary" onClick={() => openConfirm("approve")}>
                    Approve refund
                  </Button>
                  <Button variant="ghost" tone="danger" onClick={() => openConfirm("reject")}>
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="rounded-card border border-border px-3 py-2.5 text-[13px] text-text-secondary">
                  Approval requires a Manager or Finance role.
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={
          refund
            ? `${confirmAction === "approve" ? "Approve" : "Reject"} ${formatUSD(refund.amount)} refund ${refund.code}?`
            : ""
        }
        icon={confirmAction === "approve" ? CircleCheck : CircleX}
        tone={confirmAction === "approve" ? "default" : "danger"}
        onSubmit={handleConfirm}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              tone={confirmAction === "reject" ? "danger" : "default"}
              disabled={decideMutation.isPending}
            >
              {decideMutation.isPending ? "Saving…" : confirmAction === "approve" ? "Approve refund" : "Reject refund"}
            </Button>
          </>
        }
      >
        {refund && (
          <div className="flex flex-col gap-3 text-left">
            {decisionError && (
              <p role="alert" className="rounded-card border border-danger/30 bg-danger/5 px-3 py-2 text-danger">
                {decisionError}
              </p>
            )}
            <p>
              {confirmAction === "approve"
                ? "The customer is refunded and the requester is notified. Decisions can't be changed later."
                : "No money is returned and the requester is notified. Decisions can't be changed later."}
            </p>
            <FormField label="Note (optional)" hint="Visible to everyone who opens this refund.">
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={500} />
            </FormField>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
