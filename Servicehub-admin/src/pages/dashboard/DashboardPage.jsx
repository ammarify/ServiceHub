import { BookingsByStatusCard } from "../../components/BookingsByStatusCard";
import { BookingsTrendChart } from "../../components/BookingsTrendChart";
import { OpenTicketsCard } from "../../components/OpenTicketsCard";
import { PendingRefundsCard } from "../../components/PendingRefundsCard";
import { RecentBookingsCard } from "../../components/RecentBookingsCard";
import { StatCard } from "../../components/StatCard";
import { QueryError } from "../../components/ui/QueryError";
import { useAuth } from "../../context/AuthContext";
import { useDashboardSummary } from "../../hooks/useDashboard";
import { useDashboardRange } from "../../layouts/dashboardRange";
import { formatNumber, formatUSD } from "../../lib/formatters";
import { can } from "../../lib/permissions";

const RANGE_COPY = {
  today: { period: "Today", previous: "vs yesterday", soFar: "vs same time yesterday" },
  week: { period: "This Week", previous: "vs last week", soFar: "vs same point last week" },
  month: { period: "This Month", previous: "vs last month", soFar: "vs same point last month" },
};

function buildDelta(percent, { invert = false, suffix }) {
  if (!percent) return { label: `No change ${suffix}`, tone: "neutral" };
  const isPositive = percent > 0;
  const tone = isPositive !== invert ? "positive" : "negative";
  return { label: `${isPositive ? "+" : ""}${percent}% ${suffix}`, tone };
}

function buildAvailabilityDelta(available, total) {
  const percent = total === 0 ? 0 : Math.round((available / total) * 100);
  const tone = percent >= 70 ? "positive" : percent >= 40 ? "neutral" : "negative";
  return { label: `${percent}% of fleet available`, tone };
}

export function DashboardPage() {
  const { user } = useAuth();
  const [range] = useDashboardRange();
  const { data, isLoading, isError, refetch } = useDashboardSummary(range);
  const copy = RANGE_COPY[range];
  const canSeeTickets = can(user, "ticket.read");

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-[15px] font-semibold text-text-primary">Overview</h2>
        <QueryError message="Couldn't load the dashboard." onRetry={refetch} />
      </div>
    );
  }

  const kpis = data?.kpis ?? {};
  const trend = data?.trend ?? [];
  const statusBreakdown = data?.statusBreakdown ?? [];
  const recentBookings = data?.recentBookings ?? [];

  const bookingsDelta = buildDelta(kpis.bookingsDelta, { suffix: copy.previous });
  const revenueDelta = buildDelta(kpis.revenueDelta, { suffix: copy.soFar });
  const availabilityDelta = buildAvailabilityDelta(kpis.availableProviders ?? 0, kpis.totalProviders ?? 0);

  // Ticket figures only exist for roles that can open Support; finance sees
  // what's waiting for its approval instead.
  let thirdCard;
  if (canSeeTickets) {
    // More new tickets is bad news, hence invert.
    const ticketsDelta = buildDelta(kpis.newTicketsDelta, { invert: true, suffix: copy.soFar });
    thirdCard = {
      label: "Active Tickets",
      value: formatNumber(kpis.activeTickets ?? 0),
      deltaLabel: `${formatNumber(kpis.newTickets ?? 0)} new · ${ticketsDelta.label}`,
      deltaTone: ticketsDelta.tone,
    };
  } else {
    const pendingCount = data?.pendingRefunds?.count ?? 0;
    thirdCard = {
      label: "Pending Refunds",
      value: formatNumber(pendingCount),
      deltaLabel: `${formatUSD(data?.pendingRefunds?.total ?? 0)} awaiting a decision`,
      deltaTone: pendingCount > 0 ? "negative" : "neutral",
    };
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[15px] font-semibold text-text-primary">Overview · {copy.period}</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-[1100px]:grid-cols-4">
        <StatCard
          label={`Bookings (${copy.period})`}
          value={formatNumber(kpis.bookings ?? 0)}
          deltaLabel={bookingsDelta.label}
          deltaTone={bookingsDelta.tone}
          isLoading={isLoading}
        />
        <StatCard
          label={`Revenue (${copy.period})`}
          value={formatUSD(kpis.revenue ?? 0)}
          deltaLabel={revenueDelta.label}
          deltaTone={revenueDelta.tone}
          isLoading={isLoading}
        />
        <StatCard {...thirdCard} isLoading={isLoading} />
        <StatCard
          label="Available Providers"
          value={`${formatNumber(kpis.availableProviders ?? 0)}/${formatNumber(kpis.totalProviders ?? 0)}`}
          deltaLabel={availabilityDelta.label}
          deltaTone={availabilityDelta.tone}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-3">
        <div className="min-[900px]:col-span-2">
          <BookingsTrendChart data={trend} isLoading={isLoading} />
        </div>
        <BookingsByStatusCard data={statusBreakdown} isLoading={isLoading} periodLabel={copy.period} />
      </div>

      <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
        <RecentBookingsCard bookings={recentBookings} isLoading={isLoading} />
        {canSeeTickets ? (
          <OpenTicketsCard tickets={data?.openTickets ?? []} isLoading={isLoading} />
        ) : (
          <PendingRefundsCard refunds={data?.pendingRefunds?.items ?? []} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}
