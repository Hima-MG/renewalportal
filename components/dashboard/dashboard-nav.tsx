"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckCircle2,
  Hourglass,
  LayoutDashboard,
  ListChecks,
  Users,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthRole } from "@/hooks/use-auth-role";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/pending", label: "Pending", icon: Hourglass },
  { href: "/dashboard/approved", label: "Approved", icon: CheckCircle2 },
  { href: "/dashboard/rejected", label: "Rejected", icon: XCircle },
  { href: "/dashboard/completed", label: "Completed", icon: ListChecks },
];

const ADMIN_NAV_ITEM = {
  href: "/dashboard/users",
  label: "Users",
  icon: Users,
};

export function DashboardNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role } = useAuthRole();

  const items = role === "admin" ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
