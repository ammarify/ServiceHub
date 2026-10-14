import { Button } from "./Button";

// "13–24 of 55" + Prev/Next, shown under list tables. Renders nothing when
// everything fits on one page.
export function Pagination({ page, pageSize, total, totalPages, onPageChange, label = "results" }) {
  if (total === 0 || totalPages <= 1) return null;

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between text-[13px] text-text-secondary">
      <span className="font-data">
        {rangeStart}–{rangeEnd} of {total} {label}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Prev
        </Button>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </nav>
  );
}
