import { RenewalsView } from "@/components/dashboard/renewals-view";

export default function DashboardPage() {
  return (
    <RenewalsView
      title="Dashboard"
      description="Overview of all renewal requests."
      showCards
    />
  );
}
