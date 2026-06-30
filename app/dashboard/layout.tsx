import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleGuard } from "@/components/auth/role-guard";

export const metadata: Metadata = {
  title: "Finance Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["finance", "admin"]}>
      <DashboardShell>{children}</DashboardShell>
    </RoleGuard>
  );
}
