import type { Metadata } from "next";
import { Suspense } from "react";

import { PageLoader } from "@/components/shared/loading-spinner";
import { TrackPageContent } from "@/components/track/track-page-content";

export const metadata: Metadata = {
  title: "Track Renewal",
};

export default function TrackPage() {
  return (
    <main className="bg-muted/30 flex flex-1 flex-col px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            Track Your Renewal
          </h1>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm sm:text-base">
            Enter your Request ID and Tracking Token to see the latest status.
          </p>
        </div>

        <Suspense fallback={<PageLoader />}>
          <TrackPageContent />
        </Suspense>
      </div>
    </main>
  );
}
