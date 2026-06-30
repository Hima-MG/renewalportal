"use client";

import { useMemo, useState } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatCards } from "@/components/dashboard/stat-cards";
import { RenewalsTable } from "@/components/dashboard/renewals-table";
import { RenewalDrawer } from "@/components/dashboard/renewal-drawer";
import { useRenewals } from "@/hooks/use-renewals";
import type { RenewalStatus } from "@/types/renewal";

type RenewalsViewProps = {
  title: string;
  description: string;
  status?: RenewalStatus;
  showCards?: boolean;
};

export function RenewalsView({
  title,
  description,
  status,
  showCards = false,
}: RenewalsViewProps) {
  // Status pages subscribe to a server-filtered query (cheaper reads); the
  // main Dashboard page fetches everything since StatCards needs full counts.
  const { renewals, loading, error } = useRenewals(status);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedRenewal = useMemo(
    () => renewals.find((r) => r.requestId === selectedId) ?? null,
    [renewals, selectedId],
  );

  const pendingCount = useMemo(
    () => renewals.filter((r) => r.status === "Pending").length,
    [renewals],
  );

  return (
    <div className="flex flex-col gap-6">
      {showCards ? (
        <DashboardHeader pendingCount={pendingCount} />
      ) : (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
      )}

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {showCards && <StatCards renewals={renewals} />}

      <RenewalsTable
        renewals={renewals}
        loading={loading}
        onSelect={(renewal) => setSelectedId(renewal.requestId)}
        hideStatusQuickFilters={Boolean(status)}
      />

      <RenewalDrawer
        renewal={selectedRenewal}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}
