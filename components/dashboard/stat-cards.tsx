import {
  CalendarClock,
  CheckCircle2,
  CircleCheckBig,
  Hourglass,
  Wallet,
  XCircle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, isToday } from "@/utils/format";
import type { RenewalRequest } from "@/types/renewal";

type StatCardsProps = {
  renewals: RenewalRequest[];
};

export function StatCards({ renewals }: StatCardsProps) {
  const countByStatus = (status: RenewalRequest["status"]) =>
    renewals.filter((r) => r.status === status).length;

  const todaysRequests = renewals.filter((r) => isToday(r.createdAt)).length;

  const todaysRevenue = renewals
    .filter(
      (r) =>
        isToday(r.createdAt) &&
        (r.status === "Approved" || r.status === "Completed"),
    )
    .reduce((sum, r) => sum + r.amount, 0);

  const stats = [
    {
      label: "Pending",
      value: countByStatus("Pending").toLocaleString("en-IN"),
      icon: Hourglass,
      accent: "text-amber-600 bg-amber-100",
    },
    {
      label: "Approved",
      value: countByStatus("Approved").toLocaleString("en-IN"),
      icon: CheckCircle2,
      accent: "text-blue-600 bg-blue-100",
    },
    {
      label: "Rejected",
      value: countByStatus("Rejected").toLocaleString("en-IN"),
      icon: XCircle,
      accent: "text-red-600 bg-red-100",
    },
    {
      label: "Completed",
      value: countByStatus("Completed").toLocaleString("en-IN"),
      icon: CircleCheckBig,
      accent: "text-green-600 bg-green-100",
    },
    {
      label: "Today's Requests",
      value: todaysRequests.toLocaleString("en-IN"),
      icon: CalendarClock,
      accent: "text-indigo-600 bg-indigo-100",
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(todaysRevenue),
      icon: Wallet,
      accent: "text-primary bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <Card
            key={stat.label}
            className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <CardContent className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-muted-foreground truncate text-xs">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {stat.value}
                </p>
              </div>
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  stat.accent,
                )}
              >
                <Icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
