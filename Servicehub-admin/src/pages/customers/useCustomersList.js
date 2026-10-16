import { useMemo, useState } from "react";
import { useCustomers } from "../../hooks/useCustomers";
import { useDebouncedValue } from "../../lib/useDebouncedValue";

const PAGE_SIZE = 15;

export function useCustomersList() {
  const [search, setSearchRaw] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const params = useMemo(() => {
    const p = { page, limit: PAGE_SIZE };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    return p;
  }, [page, debouncedSearch]);

  const query = useCustomers(params);

  function setSearch(value) {
    setSearchRaw(value);
    setPage(1);
  }

  function clearFilters() {
    setSearchRaw("");
    setPage(1);
  }

  return {
    search,
    setSearch,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    items: query.data?.items ?? [],
    totalCount: query.data?.total ?? 0,
    totalPages: query.data?.pages ?? 1,
    clearFilters,
    hasActiveFilters: search !== "",
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
