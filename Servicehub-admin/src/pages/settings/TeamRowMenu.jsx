import { MoreHorizontal } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useDismiss } from "../../lib/useDismiss";

export function TeamRowMenu({ member, onChangeRole, onToggleStatus, onResendInvite }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const close = useCallback(() => setIsOpen(false), []);
  useDismiss(containerRef, isOpen, close);

  function run(action) {
    close();
    action();
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Actions for ${member.name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex h-7 w-7 items-center justify-center rounded-btn text-text-secondary hover:bg-canvas"
      >
        <MoreHorizontal size={16} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 min-w-[170px] rounded-card border border-border bg-surface p-1 shadow-card"
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => run(onChangeRole)}
            className="flex w-full items-center rounded-btn px-2.5 py-2 text-left text-[13px] text-text-primary hover:bg-canvas"
          >
            Change role
          </button>
          {member.invitePending && member.status === "active" && (
            <button
              role="menuitem"
              type="button"
              onClick={() => run(onResendInvite)}
              className="flex w-full items-center rounded-btn px-2.5 py-2 text-left text-[13px] text-text-primary hover:bg-canvas"
            >
              Resend invitation
            </button>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={() => run(onToggleStatus)}
            className={
              member.status === "active"
                ? "flex w-full items-center rounded-btn px-2.5 py-2 text-left text-[13px] text-danger hover:bg-canvas"
                : "flex w-full items-center rounded-btn px-2.5 py-2 text-left text-[13px] text-text-primary hover:bg-canvas"
            }
          >
            {member.status === "active" ? "Disable account" : "Enable account"}
          </button>
        </div>
      )}
    </div>
  );
}
