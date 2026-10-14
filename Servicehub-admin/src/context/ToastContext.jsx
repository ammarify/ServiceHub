import clsx from "clsx";
import { X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

const DISMISS_AFTER_MS = 5000;
const MAX_VISIBLE = 4;

const DOT_CLASSES = {
  success: "bg-success",
  error: "bg-danger",
  info: "bg-info",
};

// Lightweight feedback for actions that have no natural inline place to
// report success or failure (row menus, quick actions in a header). Same
// grammar as StatusBadge: a small tone dot, never a coloured banner.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (tone, message) => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((prev) => [...prev, { id, tone, message }].slice(-MAX_VISIBLE));
      setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (message) => show("success", message),
      error: (message) => show("error", message),
      info: (message) => show("info", message),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className="animate-dialog-enter pointer-events-auto flex items-start gap-2.5 rounded-card border border-border bg-surface px-3.5 py-3 shadow-card"
          >
            <span className={clsx("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", DOT_CLASSES[toast.tone])} />
            <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-text-primary">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-btn text-text-secondary hover:bg-canvas"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
