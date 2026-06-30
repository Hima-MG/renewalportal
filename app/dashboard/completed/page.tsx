import type { Metadata } from "next";

import { RenewalsView } from "@/components/dashboard/renewals-view";

export const metadata: Metadata = {
  title: "Completed Renewals",
};

export default function CompletedPage() {
  return (
    <RenewalsView
      title="Completed"
      description="Renewal requests that have been fully processed."
      status="Completed"
    />
  );
}
