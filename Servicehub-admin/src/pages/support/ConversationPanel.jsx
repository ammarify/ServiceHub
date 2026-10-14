import clsx from "clsx";
import { Menu, Sparkles, WifiOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { formatDate, formatTime } from "../../lib/formatters";
import { MessageComposer } from "./MessageComposer";

function groupMessagesByDay(messages) {
  const days = [];
  for (const message of messages) {
    const dayKey = formatDate(message.at);
    let day = days[days.length - 1];
    if (!day || day.key !== dayKey) {
      day = { key: dayKey, groups: [] };
      days.push(day);
    }
    let group = day.groups[day.groups.length - 1];
    if (!group || group.from !== message.from || group.senderName !== message.senderName) {
      group = { from: message.from, senderName: message.senderName, at: message.at, texts: [] };
      day.groups.push(group);
    }
    group.texts.push(message.text);
  }
  return days;
}

// Status moves an agent can make from each state.
const STATUS_ACTIONS = {
  open: [
    { status: "in_progress", label: "Start working" },
    { status: "resolved", label: "Mark resolved" },
  ],
  in_progress: [{ status: "resolved", label: "Mark resolved" }],
  resolved: [{ status: "open", label: "Reopen" }],
};

export function ConversationPanel({
  ticket,
  draftText,
  onDraftChange,
  onSend,
  isSending,
  sendError,
  onTyping,
  typingFrom,
  canReply,
  canResolve,
  onChangeStatus,
  onEscalate,
  isUpdating,
  isLive,
  onOpenQueue,
  onOpenCopilot,
}) {
  const threadRef = useRef(null);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [ticket._id, ticket.messages.length]);

  const days = groupMessagesByDay(ticket.messages);
  const statusActions = canResolve ? STATUS_ACTIONS[ticket.status] ?? [] : [];

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-canvas">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-border bg-surface px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          {onOpenQueue && (
            <button
              type="button"
              onClick={onOpenQueue}
              aria-label="Open ticket queue"
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-btn text-text-secondary hover:bg-canvas"
            >
              <Menu size={16} />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold text-text-primary">{ticket.subject}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-text-secondary">
              <span className="font-data">{ticket.code}</span>
              <span>·</span>
              <span>{ticket.customer?.name}</span>
              {ticket.booking && (
                <>
                  <span>·</span>
                  <Link to={`/bookings/${ticket.booking._id}`} className="font-data text-accent hover:underline">
                    {ticket.booking.code}
                  </Link>
                </>
              )}
              <StatusBadge status={ticket.status} />
              <StatusBadge status={ticket.priority} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {statusActions.map((action) => (
            <Button
              key={action.status}
              variant="secondary"
              disabled={isUpdating}
              onClick={() => onChangeStatus(action.status)}
            >
              {action.label}
            </Button>
          ))}
          {canResolve && ticket.status !== "resolved" && (
            <Button variant="ghost" disabled={ticket.priority === "high" || isUpdating} onClick={onEscalate}>
              {ticket.priority === "high" ? "Escalated" : "Escalate"}
            </Button>
          )}
          {onOpenCopilot && (
            <Button variant="ghost" onClick={onOpenCopilot}>
              <Sparkles size={14} />
              Copilot
            </Button>
          )}
        </div>
      </div>

      {isLive === false && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-6 py-1.5 text-[12px] text-warning">
          <WifiOff size={13} />
          Reconnecting… new messages will appear once the connection is back.
        </div>
      )}

      {typingFrom && (
        <div className="shrink-0 border-b border-border bg-surface px-6 py-1.5" aria-live="polite">
          <span className="font-data text-[11px] text-text-secondary">
            {typingFrom === "customer" ? "Customer" : "Another agent"} is typing…
          </span>
        </div>
      )}

      <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-6" aria-live="polite" aria-label="Conversation">
        {days.map((day) => (
          <div key={day.key}>
            <div className="font-data my-4 text-center text-[11px] uppercase tracking-wide text-text-secondary">
              {day.key}
            </div>
            {day.groups.map((group, index) => (
              <div
                key={index}
                className={clsx("mb-4 flex flex-col gap-1", group.from === "agent" ? "items-end" : "items-start")}
              >
                <div className="flex items-center gap-2 px-1 text-[12px]">
                  <span className="font-medium text-text-primary">{group.senderName}</span>
                  <span className="font-data text-text-secondary">{formatTime(group.at)}</span>
                </div>
                {group.texts.map((text, textIndex) => (
                  <div
                    key={textIndex}
                    className={clsx(
                      "max-w-[85%] whitespace-pre-wrap break-words rounded-card px-3 py-2 text-[13px] leading-relaxed text-text-primary sm:max-w-[70%]",
                      group.from === "agent" ? "bg-accent/10" : "border border-border bg-surface",
                    )}
                  >
                    {text}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-border bg-surface p-4">
        {canReply ? (
          <MessageComposer
            value={draftText}
            onChange={onDraftChange}
            onSend={onSend}
            onTyping={onTyping}
            isSending={isSending}
            error={sendError}
          />
        ) : (
          <p className="text-[13px] text-text-secondary">Your role can read this conversation but not reply.</p>
        )}
      </div>
    </div>
  );
}
