import { useMemo, useState } from "react";
import { useProviders } from "../../hooks/useProviders";
import { useDebouncedValue } from "../../lib/useDebouncedValue";

const PAGE_SIZE = 15;

export function useProvidersList() {
  const [search, setSearchRaw] = useState("");
  const [serviceFilter, setServiceFilterRaw] = useState("all");
  const [availableOnly, setAvailableOnlyRaw] = useState(false);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 300);

  const params = useMemo(() => {
    const p = { page, limit: PAGE_SIZE };
    if (serviceFilter !== "all") p.service = serviceFilter;
    if (availableOnly) p.availableOnly = "true";
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    return p;
  }, [page, serviceFilter, availableOnly, debouncedSearch]);

  const query = useProviders(params);

  function setSearch(value) {
    setSearchRaw(value);
    setPage(1);
  }

  function setServiceFilter(value) {
    setServiceFilterRaw(value);
    setPage(1);
  }

  function toggleAvailableOnly() {
    setAvailableOnlyRaw((prev) => !prev);
    setPage(1);
  }

  function clearFilters() {
    setSearchRaw("");
    setServiceFilterRaw("all");
    setAvailableOnlyRaw(false);
    setPage(1);
  }

  return {
    search,
    setSearch,
    serviceFilter,
    setServiceFilter,
    availableOnly,
    toggleAvailableOnly,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    items: query.data?.items ?? [],
    totalCount: query.data?.total ?? 0,
    totalPages: query.data?.pages ?? 1,
    clearFilters,
    hasActiveFilters: search !== "" || serviceFilter !== "all" || availableOnly,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
