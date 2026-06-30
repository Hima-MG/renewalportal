"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { PageLoader } from "@/components/shared/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthRole } from "@/hooks/use-auth-role";
import type { UserRole } from "@/types/user";

type RoleGuardProps = {
  allow: UserRole[];
  children: React.ReactNode;
};

function AccessDenied() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="bg-destructive/10 flex size-14 items-center justify-center rounded-full">
            <ShieldAlert className="text-destructive size-7" />
          </div>
          <div>
            <p className="text-foreground font-medium">Access denied</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Your account does not have permission to view this page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Client-side gate for UX only — the page redirects/shows "Access denied"
// based on the ID token's role claim. Real authorization still happens
// server-side (Firestore/Storage rules, API route guards), since a client
// check can always be bypassed by a determined user hitting the API
// directly.
export function RoleGuard({ allow, children }: RoleGuardProps) {
  const { status, role } = useAuthRole();
  const router = useRouter();

  useEffect(() => {
    if (status === "signed-out") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "signed-out") {
    return <PageLoader />;
  }

  if (!role || !allow.includes(role)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
