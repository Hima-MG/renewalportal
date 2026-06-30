"use client";

import { useEffect, useState } from "react";

import type { TrackedRenewal } from "@/types/renewal";

export type TrackQuery = {
  requestId: string;
  trackingToken: string;
};

type TrackState = {
  renewal: TrackedRenewal | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
};

const IDLE_STATE: TrackState = {
  renewal: null,
  loading: false,
  error: null,
  notFound: false,
};

// Polls /api/track every 20s while a query is active, so the page stays
// reasonably live without students ever holding a Firestore read
// connection (which would require the read access this whole flow is
// designed to avoid).
const POLL_INTERVAL_MS = 20_000;

export function useTrackRenewal(query: TrackQuery | null): TrackState {
  const [state, setState] = useState<TrackState>(IDLE_STATE);
  const queryKey = query ? `${query.requestId}:${query.trackingToken}` : null;
  const [trackedKey, setTrackedKey] = useState<string | null>(null);

  // Reset to a loading/idle state as soon as the query changes, derived
  // during render rather than via an effect.
  if (queryKey !== trackedKey) {
    setTrackedKey(queryKey);
    setState(
      query
        ? { renewal: null, loading: true, error: null, notFound: false }
        : IDLE_STATE,
    );
  }

  useEffect(() => {
    if (!query) return;
    let cancelled = false;

    async function fetchOnce() {
      try {
        const response = await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(query),
        });
        const json = (await response.json()) as {
          data?: TrackedRenewal;
          error?: string;
        };

        if (cancelled) return;

        if (response.status === 404) {
          setState({
            renewal: null,
            loading: false,
            error: null,
            notFound: true,
          });
          return;
        }

        if (!response.ok || !json.data) {
          setState({
            renewal: null,
            loading: false,
            error: json.error ?? "Something went wrong. Please try again.",
            notFound: false,
          });
          return;
        }

        setState({
          renewal: json.data,
          loading: false,
          error: null,
          notFound: false,
        });
      } catch {
        if (!cancelled) {
          setState({
            renewal: null,
            loading: false,
            error: "Network error. Check your connection and try again.",
            notFound: false,
          });
        }
      }
    }

    void fetchOnce();
    const interval = setInterval(() => void fetchOnce(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [query]);

  return state;
}
