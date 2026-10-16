import { useEffect, useMemo, useState } from "react";
import { useRefunds } from "../../hooks/useRefunds";

export const TABS = ["pending", "approved", "rejected"];
const PAGE_SIZE = 15;
// Approving/rejecting moves a refund out of the tab you're looking at
// (Pending) into another one; the highlight just needs to outlast "close the
// drawer, click the other tab", not match the 1s pulse animation itself.
const PULSE_ELIGIBILITY_MS = 5000;

export function useRefundsList() {
  const [activeTab, setActiveTabRaw] = useState("pending");
  const [page, setPage] = useState(1);
  const [pulseRefundId, setPulseRefundId] = useState(null);

  const params = useMemo(() => ({ status: activeTab, page, limit: PAGE_SIZE }), [activeTab, page]);
  const query = useRefunds(params);

  useEffect(() => {
    if (!pulseRefundId) return undefined;
    const timer = setTimeout(() => setPulseRefundId(null), PULSE_ELIGIBILITY_MS);
    return () => clearTimeout(timer);
  }, [pulseRefundId]);

  function setActiveTab(tab) {
    setActiveTabRaw(tab);
    setPage(1);
  }

  return {
    activeTab,
    setActiveTab,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    counts: query.data?.counts ?? { pending: 0, approved: 0, rejected: 0 },
    items: query.data?.items ?? [],
    totalCount: query.data?.total ?? 0,
    totalPages: query.data?.pages ?? 1,
    pulseRefundId,
    setPulseRefundId,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
