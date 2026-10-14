import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { getPageTitle } from "./navigation";
import { NotificationsMenu } from "./NotificationsMenu";
import { RangePicker } from "./RangePicker";

export function Topbar({ onMenuClick }) {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const isDashboard = location.pathname === "/dashboard";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-canvas px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="flex h-7 w-7 items-center justify-center rounded-btn text-text-secondary hover:bg-surface md:hidden"
        >
          <Menu size={16} />
        </button>
        <h1 className="truncate text-[20px] font-semibold text-text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <NotificationsMenu />
        {isDashboard && <RangePicker />}
      </div>
    </header>
  );
}
