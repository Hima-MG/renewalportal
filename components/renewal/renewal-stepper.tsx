import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export const RENEWAL_STEPS = [
  { step: 1, label: "Student Details" },
  { step: 2, label: "Payment Details" },
  { step: 3, label: "Screenshot Upload" },
] as const;

export function RenewalStepper({ currentStep }: { currentStep: number }) {
  return (
    <ol className="mb-6 flex items-center justify-between gap-2">
      {RENEWAL_STEPS.map(({ step, label }, index) => {
        const isDone = step < currentStep;
        const isActive = step === currentStep;

        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                  isDone
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground",
                )}
              >
                {isDone ? <Check className="size-4" /> : step}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>

            {index < RENEWAL_STEPS.length - 1 && (
              <span
                className={cn(
                  "mx-2 h-px flex-1",
                  isDone ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
