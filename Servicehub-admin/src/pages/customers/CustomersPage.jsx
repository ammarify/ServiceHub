import { Plus, UserRoundSearch } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import { QueryError } from "../../components/ui/QueryError";
import { useAuth } from "../../context/AuthContext";
import { formatNumber, formatUSD, relativeTime } from "../../lib/formatters";
import { can } from "../../lib/permissions";
import { useQueryParamState } from "../../lib/useQueryParamState";
import { BookingFormDialog } from "../bookings/BookingFormDialog";
import { CustomerDrawer } from "./CustomerDrawer";
import { CustomerFormDialog } from "./CustomerFormDialog";
import { CustomersToolbar } from "./CustomersToolbar";
import { useCustomersList } from "./useCustomersList";

const COLUMNS = [
  {
    key: "name",
    label: "Name",
    render: (customer) => (
      <div className="flex items-center gap-2.5">
        <Avatar name={customer.name} size={24} />
        <span className="text-text-primary">{customer.name}</span>
      </div>
    ),
  },
  {
    key: "phone",
    label: "Phone",
    render: (customer) => <span className="font-data text-text-secondary">{customer.phone}</span>,
  },
  { key: "area", label: "Area" },
  {
    key: "totalBookings",
    label: "Bookings",
    render: (customer) => <span className="font-data">{formatNumber(customer.totalBookings)}</span>,
  },
  {
    key: "totalSpent",
    label: "Total Spent",
    align: "right",
    render: (customer) => <span className="font-data">{formatUSD(customer.totalSpent)}</span>,
  },
  {
    key: "lastBookingAt",
    label: "Last Booking",
    render: (customer) =>
      customer.lastBookingAt ? (
        <span className="font-data">{relativeTime(customer.lastBookingAt)}</span>
      ) : (
        <span className="font-data text-text-secondary">—</span>
      ),
  },
];

export function CustomersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const list = useCustomersList();
  const canManage = can(user, "customer.manage");
  const canCreateBooking = can(user, "booking.create");
  // ?customer=<id> opens the drawer (deep links from search, bookings...).
  const [selectedCustomerId, setSelectedCustomerId] = useQueryParamState("customer");
  const [drawerCustomerId, setDrawerCustomerId] = useState(selectedCustomerId);
  const [formState, setFormState] = useState(null);
  const [bookingFor, setBookingFor] = useState(null);

  if (selectedCustomerId && selectedCustomerId !== drawerCustomerId) {
    setDrawerCustomerId(selectedCustomerId);
  }

  return (
    <div className="flex flex-col gap-4">
      <CustomersToolbar
        {...list}
        actions={
          canManage && (
            <Button variant="primary" onClick={() => setFormState({ customer: null })}>
              <Plus size={14} />
              Add customer
            </Button>
          )
        }
      />

      <Card padded={false}>
        {list.isError ? (
          <QueryError message="Couldn't load customers." onRetry={list.refetch} />
        ) : (
          <DataTable
            columns={COLUMNS}
            data={list.items}
            getRowKey={(customer) => customer._id}
            onRowClick={(customer) => setSelectedCustomerId(customer._id)}
            isLoading={list.isLoading}
            skeletonRowCount={8}
            emptyState={
              <div className="flex flex-col items-center gap-3">
                <UserRoundSearch size={28} className="text-text-secondary" />
                <p className="text-[13px] text-text-secondary">
                  {list.hasActiveFilters ? "No customers match your search" : "No customers yet"}
                </p>
                {list.hasActiveFilters && (
                  <Button variant="ghost" onClick={list.clearFilters}>
                    Clear search
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
          label="customers"
        />
      )}

      <CustomerDrawer
        customerId={drawerCustomerId}
        open={Boolean(selectedCustomerId)}
        onClose={() => setSelectedCustomerId(null)}
        canManage={canManage}
        canOpenTickets={can(user, "ticket.read")}
        canCreateBooking={canCreateBooking}
        onEdit={(customer) => setFormState({ customer })}
        onNewBooking={(customer) => setBookingFor(customer)}
      />

      <CustomerFormDialog
        open={formState !== null}
        customer={formState?.customer}
        onClose={() => setFormState(null)}
        onSaved={(customer) => {
          if (!formState?.customer) setSelectedCustomerId(customer._id);
        }}
      />

      {canCreateBooking && (
        <BookingFormDialog
          open={bookingFor !== null}
          initialCustomer={bookingFor}
          onClose={() => setBookingFor(null)}
          onSaved={(booking) => navigate(`/bookings/${booking._id}`)}
        />
      )}
    </div>
  );
}
