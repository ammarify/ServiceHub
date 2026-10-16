import { LogOut, UserRound } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../components/ui/Avatar";
import { useAuth } from "../context/AuthContext";
import { useDismiss } from "../lib/useDismiss";
import { humanize } from "../lib/formatters";

export function UserMenu({ onNavigate }) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const close = useCallback(() => setIsOpen(false), []);
  useDismiss(containerRef, isOpen, close);

  return (
    <div ref={containerRef} className="relative">
      {isOpen && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-10 mb-2 min-w-[180px] rounded-card border border-border bg-surface p-1 shadow-card"
        >
          <Link
            role="menuitem"
            to="/account"
            onClick={() => {
              close();
              onNavigate?.();
            }}
            className="flex w-full items-center gap-2 rounded-btn px-2.5 py-2 text-left text-[13px] text-text-primary transition-colors hover:bg-canvas"
          >
            <UserRound size={14} />
            Account settings
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-btn px-2.5 py-2 text-left text-[13px] text-danger transition-colors hover:bg-canvas"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex w-full items-center gap-2.5 rounded-btn px-2.5 py-2 transition-colors hover:bg-canvas md:justify-center lg:justify-start"
      >
        <Avatar name={user.name} size={28} />
        <div className="min-w-0 text-left md:hidden lg:block">
          <div className="truncate text-[13px] font-medium text-text-primary">
            {user.name}
          </div>
          <div className="font-data text-[10px] uppercase text-text-secondary">
            {humanize(user.role)}
          </div>
        </div>
      </button>
    </div>
  );
}
