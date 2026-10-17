import clsx from "clsx";
import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../hooks/useSearch";
import { useDebouncedValue } from "../lib/useDebouncedValue";

const TYPE_LABELS = { booking: "Booking", customer: "Customer", ticket: "Ticket" };

// Every result opens the exact record: bookings their detail page,
// customers their profile drawer, tickets their conversation.
function buildResults(data) {
  if (!data) return [];
  return [
    ...data.bookings.map((b) => ({
      type: "booking",
      key: b._id,
      mono: b.code,
      label: b.service,
      path: `/bookings/${b._id}`,
    })),
    ...data.customers.map((c) => ({
      type: "customer",
      key: c._id,
      mono: c.phone,
      label: c.name,
      path: `/customers?customer=${c._id}`,
    })),
    ...data.tickets.map((t) => ({
      type: "ticket",
      key: t._id,
      mono: t.code,
      label: t.subject,
      path: `/support?ticket=${t._id}`,
    })),
  ];
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export function SidebarSearch({ onNavigate }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const listboxId = useId();

  const debouncedQuery = useDebouncedValue(query, 300);
  const { data, isFetching } = useSearch(debouncedQuery);
  const results = useMemo(() => buildResults(data), [data]);
  const isSettling = isFetching || debouncedQuery !== query;

  useEffect(() => {
    function handleGlobalKeyDown(event) {
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  function handleSelect(result) {
    navigate(result.path);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
    onNavigate?.();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleSelect(results[Math.min(activeIndex, results.length - 1)]);
    }
  }

  const showPanel = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex h-8 items-center gap-2 rounded-card border border-border bg-canvas px-2.5 text-text-secondary focus-within:border-accent">
        <Search size={14} className="shrink-0" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search bookings, customers and tickets"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-activedescendant={showPanel && results.length ? `${listboxId}-${activeIndex}` : undefined}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onFocus={() => query && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="w-full bg-transparent text-[13px] text-text-primary placeholder:text-text-secondary focus:outline-none"
        />
        <kbd className="font-data shrink-0 text-[11px] text-text-secondary">{isMac ? "⌘K" : "Ctrl K"}</kbd>
      </div>

      {/* Wider than the sidebar input so names and subjects aren't cut to a
          few characters; it overlaps the page content while open. */}
      {showPanel && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 max-h-80 w-[min(400px,calc(100vw-1.5rem))] overflow-y-auto rounded-card border border-border bg-surface p-1 shadow-pop"
        >
          {isSettling && results.length === 0 ? (
            <p className="px-3 py-2.5 text-[13px] text-text-secondary">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2.5 text-[13px] text-text-secondary">No results</p>
          ) : (
            results.map((result, index) => (
              <button
                key={`${result.type}-${result.key}`}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                type="button"
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setActiveIndex(index)}
                className={clsx(
                  "flex w-full items-center gap-2.5 rounded-btn px-2.5 py-2 text-left transition-colors",
                  index === activeIndex ? "bg-accent/10" : "hover:bg-canvas",
                )}
              >
                <span className="font-data w-16 shrink-0 truncate text-[11px] text-text-secondary">
                  {result.mono}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-text-primary">{result.label}</span>
                <span className="shrink-0 text-[11px] text-text-secondary">{TYPE_LABELS[result.type]}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
