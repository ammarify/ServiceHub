import clsx from "clsx";
import { Sparkles } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { QueryError } from "../../components/ui/QueryError";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { relativeTime } from "../../lib/formatters";
import { TABS } from "./useSupportTickets";

const TAB_LABELS = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const EMPTY_TEXT = {
  open: "No open tickets. New ones appear here instantly.",
  in_progress: "Nothing in progress.",
  resolved: "No resolved tickets yet.",
};

function QueueSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 border-b border-border px-4 py-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function TicketQueue({
  tickets,
  openCount,
  activeTab,
  onTabChange,
  selectedTicketId,
  onSelectTicket,
  pulseTicketId,
  isLoading,
  isError,
  onRetry,
  hasMore,
  onLoadMore,
  isLoadingMore,
}) {
  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="shrink-0 border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold text-text-primary">Tickets</h2>
          <span
            className="font-data rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent"
            title="Open tickets"
          >
            {openCount}
          </span>
        </div>
        <div className="mt-3 flex gap-1" role="tablist" aria-label="Ticket status">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => onTabChange(tab)}
              className={clsx(
                "rounded-btn px-2.5 py-1 text-[13px] transition-colors",
                activeTab === tab
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:bg-canvas hover:text-text-primary",
              )}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isError ? (
          <QueryError message="Couldn't load tickets." onRetry={onRetry} />
        ) : isLoading ? (
          <QueueSkeleton />
        ) : tickets.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-text-secondary">{EMPTY_TEXT[activeTab]}</p>
        ) : (
          <>
            {tickets.map((ticket) => (
              <button
                key={ticket._id}
                type="button"
                onClick={() => onSelectTicket(ticket._id)}
                aria-current={selectedTicketId === ticket._id ? "true" : undefined}
                className={clsx(
                  "flex w-full flex-col gap-1.5 border-b border-border px-4 py-3 text-left transition-colors",
                  selectedTicketId === ticket._id ? "bg-accent/10" : "hover:bg-canvas",
                  pulseTicketId === ticket._id && "animate-highlight-pulse",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-text-primary">
                    {ticket.subject}
                  </span>
                  {ticket.unanswered && (
                    <span
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      title="Waiting for a reply"
                      aria-label="Waiting for a reply"
                    />
                  )}
                </div>
                <div className="truncate text-[12px] text-text-secondary">{ticket.customer?.name ?? "Unknown customer"}</div>
                <div className="flex items-center gap-2">
                  <span className="font-data text-[11px] text-text-secondary">{ticket.code}</span>
                  <StatusBadge status={ticket.priority} />
                  {ticket.hasAnalysis && <Sparkles size={11} className="text-accent" aria-label="AI analyzed" />}
                  <span className="font-data ml-auto shrink-0 text-[11px] text-text-secondary">
                    {relativeTime(ticket.updatedAt)}
                  </span>
                </div>
              </button>
            ))}
            {hasMore && (
              <div className="p-3">
                <Button variant="ghost" className="w-full justify-center" onClick={onLoadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
