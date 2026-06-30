import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateTime, type DateInput } from "@/utils/format";
import type { RenewalStatus } from "@/types/renewal";

type TimelineStep = {
  label: string;
  state: "done" | "current" | "upcoming";
  date: string | null;
  danger?: boolean;
};

// Accepts either a live dashboard renewal (Firestore Timestamp) or a
// /api/track response (ISO date strings) — see DateInput.
export type TimelineRenewal = {
  status: RenewalStatus;
  createdAt: DateInput;
  updatedAt: DateInput;
};

function buildSteps(renewal: TimelineRenewal): TimelineStep[] {
  const submittedDate = formatDateTime(renewal.createdAt);

  if (renewal.status === "Rejected") {
    return [
      { label: "Submitted", state: "done", date: submittedDate },
      { label: "Pending Verification", state: "done", date: null },
      {
        label: "Rejected",
        state: "current",
        date: formatDateTime(renewal.updatedAt),
        danger: true,
      },
    ];
  }

  const stageIndex = { Pending: 1, Approved: 2, Completed: 3 }[renewal.status];

  const labels = ["Submitted", "Pending Verification", "Approved", "Completed"];

  return labels.map((label, index) => ({
    label,
    state:
      index < stageIndex
        ? "done"
        : index === stageIndex
          ? "current"
          : "upcoming",
    date:
      index === 0
        ? submittedDate
        : index === stageIndex
          ? formatDateTime(renewal.updatedAt)
          : null,
  }));
}

export function TrackTimeline({ renewal }: { renewal: TimelineRenewal }) {
  const steps = buildSteps(renewal);

  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <li key={step.label} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute top-7 left-[15px] h-full w-px",
                  step.state === "done" ? "bg-primary/40" : "bg-border",
                )}
                aria-hidden
              />
            )}

            <span
              className={cn(
                "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium",
                step.danger
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : step.state === "done"
                    ? "border-primary bg-primary text-primary-foreground"
                    : step.state === "current"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground",
              )}
            >
              {step.danger ? (
                <X className="size-4" />
              ) : step.state === "done" ? (
                <Check className="size-4" />
              ) : (
                <span className="size-2 rounded-full bg-current" />
              )}
            </span>

            <div className="flex flex-col pt-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  step.danger
                    ? "text-destructive"
                    : step.state === "upcoming"
                      ? "text-muted-foreground"
                      : "text-foreground",
                )}
              >
                {step.label}
              </span>
              {step.date && (
                <span className="text-muted-foreground text-xs">
                  {step.date}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
