import { BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { DetailField } from "../../components/ui/DetailField";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";

export function BookingProviderCard({ provider, isLoading, canOpenProfile }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-semibold text-text-primary">Provider</div>
        {!isLoading && provider && canOpenProfile && (
          <Link to={`/providers?provider=${provider._id}`} className="text-[13px] text-accent hover:underline">
            View profile
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-28" />
          </>
        ) : provider ? (
          <>
            <DetailField label="Name">
              <span className="inline-flex items-center gap-1.5">
                {provider.name}
                {provider.verified && <BadgeCheck size={13} className="text-success" aria-label="Verified" />}
              </span>
            </DetailField>
            <DetailField label="Phone" mono>
              {provider.phone}
            </DetailField>
            <DetailField label="Rating" mono>
              {provider.rating.toFixed(1)}
            </DetailField>
            <DetailField label="Services">{provider.services?.join(", ")}</DetailField>
            <div>
              <div className="text-[12px] text-text-secondary">Availability</div>
              <div className="mt-0.5">
                <StatusBadge status={provider.isAvailable ? "available" : "off_duty"} />
              </div>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-text-secondary">No provider assigned yet.</p>
        )}
      </div>
    </Card>
  );
}
