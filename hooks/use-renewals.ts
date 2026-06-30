"use client";

import { useEffect, useState } from "react";

import { subscribeToRenewals } from "@/lib/firebase";
import type { RenewalRequest, RenewalStatus } from "@/types/renewal";

type UseRenewalsResult = {
  renewals: RenewalRequest[];
  loading: boolean;
  error: string | null;
};

// Pass `status` to subscribe to a server-side-filtered query (cheaper —
// only matching documents are read/transferred) instead of the whole
// collection. Used by the per-status dashboard pages; the main Dashboard
// page omits it since it needs full counts for the stat cards.
export function useRenewals(status?: RenewalStatus): UseRenewalsResult {
  const [renewals, setRenewals] = useState<RenewalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset to a loading state as soon as `status` changes, derived during
  // render rather than via an effect.
  const [trackedStatus, setTrackedStatus] = useState(status);
  if (status !== trackedStatus) {
    setTrackedStatus(status);
    setLoading(true);
  }

  useEffect(() => {
    const unsubscribe = subscribeToRenewals(
      (data) => {
        setRenewals(data);
        setLoading(false);
        setError(null);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
      { status },
    );

    return () => unsubscribe();
  }, [status]);

  return { renewals, loading, error };
}
