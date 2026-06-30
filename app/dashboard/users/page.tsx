import type { Metadata } from "next";

import { RoleGuard } from "@/components/auth/role-guard";
import { UserManagement } from "@/components/admin/user-management";

export const metadata: Metadata = {
  title: "User Management",
};

export default function UsersPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            User Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage admin and finance accounts and their access.
          </p>
        </div>

        <UserManagement />
      </div>
    </RoleGuard>
  );
}
