"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced server-side too (Next.js logs Route Handler/RSC errors on
    // its own); this just keeps a client-visible trail during triage.
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main className="bg-muted/30 flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="bg-destructive/10 flex size-14 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive size-7" />
          </div>
          <div>
            <p className="text-foreground font-medium">Something went wrong</p>
            <p className="text-muted-foreground mt-1 text-sm">
              An unexpected error occurred. Please try again.
            </p>
          </div>
          <Button onClick={reset}>Try Again</Button>
        </CardContent>
      </Card>
    </main>
  );
}
