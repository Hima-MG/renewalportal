import type { Metadata } from "next";

import { RenewalsView } from "@/components/dashboard/renewals-view";

export const metadata: Metadata = {
  title: "Approved Renewals",
};

export default function ApprovedPage() {
  return (
    <RenewalsView
      title="Approved"
      description="Renewal requests that have been approved."
      status="Approved"
    />
  );
}
