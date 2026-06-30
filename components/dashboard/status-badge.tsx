import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RenewalStatus } from "@/types/renewal";

const STATUS_STYLES: Record<RenewalStatus, string> = {
  Pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  Approved: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  Completed:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
};

export function StatusBadge({ status }: { status: RenewalStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", STATUS_STYLES[status])}
    >
      {status}
    </Badge>
  );
}
