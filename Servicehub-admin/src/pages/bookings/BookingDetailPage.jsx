import { ArrowLeft, CalendarClock, CalendarX2, CheckCircle2, Pencil, PlayCircle, Undo2, UserRoundCog, XCircle } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { RequestRefundDialog } from "../../components/refunds/RequestRefundDialog";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { FormField } from "../../components/ui/FormField";
import { QueryError } from "../../components/ui/QueryError";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Textarea } from "../../components/ui/Textarea";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";
import { useBooking, useCancelBooking, useUpdateBookingStatus } from "../../hooks/useBookings";
import { errorMessage } from "../../lib/api";
import { formatDateTime } from "../../lib/formatters";
import { can } from "../../lib/permissions";
import { BookingCustomerCard } from "./BookingCustomerCard";
import { BookingFormDialog } from "./BookingFormDialog";
import { BookingPaymentCard } from "./BookingPaymentCard";
import { BookingProviderCard } from "./BookingProviderCard";
import { BookingTimelineCard } from "./BookingTimelineCard";
import { ReassignProviderDialog } from "./ReassignProviderDialog";

// Bookings that haven't started can still be changed (same rule as the API).
const OPEN_STATUSES = ["pending", "assigned"];

function CancelBookingDialog({ booking, open, onClose }) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const mutation = useCancelBooking(booking._id);

  if (!open) return null;

  function handleConfirm() {
    mutation.mutate(reason.trim() || undefined, {
      onSuccess: () => {
        toast.success(`Booking ${booking.code} cancelled.`);
        setReason("");
        onClose();
      },
    });
  }

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title={`Cancel booking ${booking.code}?`}
      icon={CalendarX2}
      tone="danger"
      onSubmit={handleConfirm}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keep booking
          </Button>
          <Button type="submit" variant="primary" tone="danger" disabled={mutation.isPending}>
            {mutation.isPending ? "Cancelling…" : "Cancel booking"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-left">
        {mutation.isError && (
          <p role="alert" className="text-danger">
            {errorMessage(mutation.error, "Couldn't cancel this booking.")}
          </p>
        )}
        <p>The provider is released from the job and the customer's booking ends. This can't be undone.</p>
        <FormField label="Reason (optional)" hint="Saved on the booking's timeline.">
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} maxLength={300} />
        </FormField>
      </div>
    </ConfirmDialog>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-6 w-28" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function BookingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [openDialog, setOpenDialog] = useState(null);

  const bookingQuery = useBooking(id);
  const booking = bookingQuery.data;
  const statusMutation = useUpdateBookingStatus(id);

  if (bookingQuery.isError) {
    if (bookingQuery.error?.response?.status === 404) {
      return (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-[13px] text-text-secondary">Booking not found.</p>
          <Link to="/bookings" className="text-[13px] text-accent hover:underline">
            Back to bookings
          </Link>
        </div>
      );
    }
    return <QueryError message="Couldn't load this booking." onRetry={bookingQuery.refetch} />;
  }

  const isLoading = bookingQuery.isLoading;
  const status = booking?.status;
  const isOpen = OPEN_STATUSES.includes(status);
  const summary = booking?.refundSummary;

  const actions = [];
  if (booking) {
    if (can(user, "booking.update") && status === "assigned") {
      actions.push({ key: "start", label: "Mark started", icon: PlayCircle, onClick: () => changeStatus("in_progress") });
    }
    if (can(user, "booking.update") && status === "in_progress") {
      actions.push({ key: "complete", label: "Mark completed", icon: CheckCircle2, onClick: () => changeStatus("completed") });
    }
    if (can(user, "booking.reassign") && isOpen) {
      actions.push({
        key: "reassign",
        label: booking.provider ? "Reassign provider" : "Assign provider",
        icon: UserRoundCog,
        onClick: () => setOpenDialog("reassign"),
      });
    }
    if (can(user, "booking.update") && isOpen) {
      actions.push({ key: "edit", label: "Edit", icon: Pencil, onClick: () => setOpenDialog("edit") });
    }
    if (can(user, "refund.request") && summary && summary.refundable > 0 && summary.pendingTotal === 0) {
      actions.push({ key: "refund", label: "Request refund", icon: Undo2, onClick: () => setOpenDialog("refund") });
    }
    if (can(user, "booking.reassign") && isOpen) {
      actions.push({ key: "cancel", label: "Cancel booking", icon: XCircle, tone: "danger", onClick: () => setOpenDialog("cancel") });
    }
  }

  async function changeStatus(nextStatus) {
    // Completing is final: the job counts toward revenue and the booking
    // can't be edited afterwards, so it's confirmed first.
    if (nextStatus === "completed") {
      const done = await confirm({
        title: `Mark ${booking.code} completed?`,
        description: "The job counts toward revenue and the provider's earnings, and the booking can no longer be edited.",
        confirmLabel: "Mark completed",
        pendingLabel: "Saving…",
        icon: CheckCircle2,
        onConfirm: () => statusMutation.mutateAsync(nextStatus),
      });
      if (done) toast.success(`${booking.code} marked completed.`);
      return;
    }

    statusMutation.mutate(nextStatus, {
      onSuccess: (updated) => toast.success(`${updated.code} marked started.`),
      onError: (error) => toast.error(errorMessage(error, "Couldn't update this booking.")),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Link
          to="/bookings"
          className="inline-flex w-fit items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={14} />
          Back to bookings
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          {isLoading ? (
            <HeaderSkeleton />
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-data text-[20px] font-semibold text-text-primary">{booking.code}</h1>
                <StatusBadge status={status} />
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[13px] text-text-secondary">
                <CalendarClock size={14} />
                <span>
                  {booking.service} · <span className="font-data">{formatDateTime(booking.scheduledAt)}</span>
                </span>
              </div>
            </div>
          )}

          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button
                  key={action.key}
                  variant={action.tone === "danger" ? "ghost" : "secondary"}
                  tone={action.tone ?? "default"}
                  onClick={action.onClick}
                  disabled={statusMutation.isPending && (action.key === "start" || action.key === "complete")}
                >
                  <action.icon size={14} />
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-3">
        <div className="min-[900px]:col-span-2">
          <BookingTimelineCard timeline={booking?.timeline ?? []} isLoading={isLoading} />
        </div>
        <div className="flex flex-col gap-4">
          <BookingCustomerCard customer={booking?.customer} isLoading={isLoading} canOpenProfile={can(user, "customer.read")} />
          <BookingProviderCard provider={booking?.provider} isLoading={isLoading} canOpenProfile={can(user, "provider.read")} />
          <BookingPaymentCard booking={booking} isLoading={isLoading} />
        </div>
      </div>

      {booking && (
        <>
          <ReassignProviderDialog open={openDialog === "reassign"} booking={booking} onClose={() => setOpenDialog(null)} />
          <BookingFormDialog open={openDialog === "edit"} booking={booking} onClose={() => setOpenDialog(null)} />
          <CancelBookingDialog open={openDialog === "cancel"} booking={booking} onClose={() => setOpenDialog(null)} />
          <RequestRefundDialog open={openDialog === "refund"} bookingId={booking._id} onClose={() => setOpenDialog(null)} />
        </>
      )}
    </div>
  );
}
