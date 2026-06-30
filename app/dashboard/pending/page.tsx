import type { Metadata } from "next";

import { RenewalsView } from "@/components/dashboard/renewals-view";

export const metadata: Metadata = {
  title: "Pending Renewals",
};

export default function PendingPage() {
  return (
    <RenewalsView
      title="Pending"
      description="Renewal requests awaiting review."
      status="Pending"
    />
  );
}
