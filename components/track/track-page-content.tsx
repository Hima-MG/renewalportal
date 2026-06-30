"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { TrackSearchForm } from "@/components/track/track-search-form";
import { TrackResult } from "@/components/track/track-result";
import { TrackEmptyState } from "@/components/track/track-empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useTrackRenewal, type TrackQuery } from "@/hooks/use-track-renewal";

export function TrackPageContent() {
  const searchParams = useSearchParams();
  const requestIdParam = searchParams.get("requestId") ?? "";
  const trackingTokenParam = searchParams.get("token") ?? "";

  const [query, setQuery] = useState<TrackQuery | null>(
    requestIdParam && trackingTokenParam
      ? { requestId: requestIdParam, trackingToken: trackingTokenParam }
      : null,
  );

  const { renewal, loading, notFound, error } = useTrackRenewal(query);

  return (
    <div className="flex flex-col gap-8">
      <TrackSearchForm
        onSearch={setQuery}
        loading={loading}
        initialRequestId={requestIdParam}
        initialTrackingToken={trackingTokenParam}
      />

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive mx-auto w-full max-w-lg rounded-xl border px-4 py-3 text-center text-sm">
          {error}
        </div>
      )}

      {loading && query && <PageLoader />}

      {!loading && renewal && <TrackResult renewal={renewal} />}

      {!loading && notFound && <TrackEmptyState />}
    </div>
  );
}
