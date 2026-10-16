import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { DetailField } from "../../components/ui/DetailField";
import { Skeleton } from "../../components/ui/Skeleton";

// Uses the customer embedded in the booking response, so every role that
// can open a booking sees who it's for - only the link to the full profile
// depends on customer access.
export function BookingCustomerCard({ customer, isLoading, canOpenProfile }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-semibold text-text-primary">Customer</div>
        {!isLoading && customer && canOpenProfile && (
          <Link to={`/customers?customer=${customer._id}`} className="text-[13px] text-accent hover:underline">
            View profile
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
          </>
        ) : customer ? (
          <>
            <DetailField label="Name">{customer.name}</DetailField>
            <DetailField label="Phone" mono>
              {customer.phone}
            </DetailField>
            <DetailField label="Area">{customer.area}</DetailField>
          </>
        ) : (
          <p className="text-[13px] text-text-secondary">Customer record not found.</p>
        )}
      </div>
    </Card>
  );
}
