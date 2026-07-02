import { CheckCircle2 } from "lucide-react";

export function PaymentSuccessBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto mb-5 w-full max-w-2xl rounded-2xl border border-green-200 bg-green-50/80 p-4 dark:border-green-900/50 dark:bg-green-950/30 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400"
        />
        <div>
          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
            Payment Successful
          </p>
          <p className="mt-0.5 text-sm text-green-700 dark:text-green-300">
            Please complete the form below to submit your renewal request.
            Your course details have already been filled in.
          </p>
        </div>
      </div>
    </div>
  );
}
