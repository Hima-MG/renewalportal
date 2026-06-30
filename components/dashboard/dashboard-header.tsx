"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";

function useClock() {
  // Starts null so the server-rendered markup and the first client render
  // match; the real time fills in once the interval below ticks.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return now;
}

export function DashboardHeader({ pendingCount }: { pendingCount: number }) {
  const now = useClock();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, Finance Manager
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {now
            ? new Intl.DateTimeFormat("en-IN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              }).format(now)
            : " "}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700"
        >
          {pendingCount} Pending Request{pendingCount === 1 ? "" : "s"}
        </Badge>
        <span className="bg-background text-foreground rounded-xl border px-3 py-1.5 font-mono text-sm tabular-nums">
          {now
            ? new Intl.DateTimeFormat("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }).format(now)
            : "--:--:--"}
        </span>
      </div>
    </div>
  );
}
