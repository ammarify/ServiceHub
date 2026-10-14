import { PackageSearch, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import { QueryError } from "../../components/ui/QueryError";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatUSD, formatTime } from "../../lib/formatters";
import { can } from "../../lib/permissions";
import { BookingFormDialog } from "./BookingFormDialog";
import { BookingsToolbar } from "./BookingsToolbar";
import { useBookingsList } from "./useBookingsList";

const COLUMNS = [
  {
    key: "code",
    label: "ID",
    render: (booking) => <span className="font-data text-text-secondary">{booking.code}</span>,
  },
  { key: "customerName", label: "Customer", render: (booking) => booking.customer?.name ?? "Unknown" },
  { key: "service", label: "Service" },
  {
    key: "providerName",
    label: "Provider",
    render: (booking) =>
      booking.provider?.name ?? <span className="text-text-secondary">Unassigned</span>,
  },
  {
    key: "scheduledAt",
    label: "Scheduled",
    sortable: true,
    render: (booking) => (
      <span className="font-data">
        {formatDate(booking.scheduledAt)} {formatTime(booking.scheduledAt)}
      </span>
    ),
  },
  {
    key: "amount",
    label: "Amount",
    align: "right",
    sortable: true,
    render: (booking) => <span className="font-data">{formatUSD(booking.amount)}</span>,
  },
  {
    key: "status",
    label: "Status",
    render: (booking) => <StatusBadge status={booking.status} />,
  },
];

export function BookingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const list = useBookingsList();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const canCreate = can(user, "booking.create");

  return (
    <div className="flex flex-col gap-4">
      <BookingsToolbar
        {...list}
        actions={
          canCreate && (
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              <Plus size={14} />
              New booking
            </Button>
          )
        }
      />

      <Card padded={false}>
        {list.isError ? (
          <QueryError message="Couldn't load bookings." onRetry={list.refetch} />
        ) : (
          <DataTable
            columns={COLUMNS}
            data={list.pageItems}
            getRowKey={(booking) => booking._id}
            onRowClick={(booking) => navigate(`/bookings/${booking._id}`)}
            sortKey={list.sortKey}
            sortDirection={list.sortDirection}
            onSortChange={list.onSortChange}
            isLoading={list.isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-3">
                <PackageSearch size={28} className="text-text-secondary" />
                <p className="text-[13px] text-text-secondary">
                  {list.hasActiveFilters ? "No bookings match your filters" : "No bookings yet"}
                </p>
                {list.hasActiveFilters && (
                  <Button variant="ghost" onClick={list.clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            }
          />
        )}
      </Card>

      {!list.isLoading && !list.isError && (
        <Pagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.totalCount}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          label="bookings"
        />
      )}

      {canCreate && (
        <BookingFormDialog
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSaved={(booking) => navigate(`/bookings/${booking._id}`)}
        />
      )}
    </div>
  );
}
