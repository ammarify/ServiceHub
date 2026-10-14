import { useEffect } from "react";

// Closes a popover/menu on an outside click or Escape. Shared by the user
// menu, row menus, the notifications panel and the range picker.
export function useDismiss(containerRef, isOpen, onDismiss) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onDismiss();
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") onDismiss();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, isOpen, onDismiss]);
}
