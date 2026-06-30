import type { Metadata } from "next";

import { RenewalsView } from "@/components/dashboard/renewals-view";

export const metadata: Metadata = {
  title: "Rejected Renewals",
};

export default function RejectedPage() {
  return (
    <RenewalsView
      title="Rejected"
      description="Renewal requests that were rejected."
      status="Rejected"
    />
  );
}
