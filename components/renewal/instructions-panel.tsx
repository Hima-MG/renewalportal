import { Info } from "lucide-react";

export function InstructionsPanel() {
  return (
    <div className="mx-auto mb-6 w-full max-w-2xl rounded-2xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">
      <div className="mb-3 flex items-center gap-2">
        <Info
          aria-hidden="true"
          className="size-5 shrink-0 text-blue-600 dark:text-blue-400"
        />
        <h2 className="text-base font-semibold text-blue-900 dark:text-blue-100">
          Important Instructions
        </h2>
      </div>

      <p className="mb-3 text-sm text-blue-800 dark:text-blue-200">
        Please ensure the following before submitting your renewal request:
      </p>

      <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
        <li className="flex gap-2">
          <span aria-hidden="true">📧</span>
          <span>
            Use the{" "}
            <strong className="font-semibold">same email address</strong>{" "}
            registered with your Civilezy account.
          </span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true">📱</span>
          <span>
            Use the{" "}
            <strong className="font-semibold">same mobile number</strong>{" "}
            registered with your Civilezy account.
          </span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true">📚</span>
          <div>
            <span>
              Enter the{" "}
              <strong className="font-semibold">
                FULL course name exactly
              </strong>{" "}
              as it appears in your Civilezy account.
            </span>
            <div className="mt-1.5 rounded-lg border border-blue-200 bg-blue-100/60 px-3 py-2 dark:border-blue-800/60 dark:bg-blue-900/30">
              <p className="mb-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                Example:
              </p>
              <ul className="space-y-0.5 text-xs text-blue-700 dark:text-blue-300">
                <li>Assistant Engineer (B.Tech Level)</li>
                <li>Overseer Grade III (ITI Level)</li>
                <li>Diploma Level</li>
                <li>Surveyor Grade</li>
              </ul>
            </div>
          </div>
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true">💳</span>
          <span>
            Upload a{" "}
            <strong className="font-semibold">
              clear payment screenshot
            </strong>{" "}
            showing the transaction details.
          </span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true">🆔</span>
          <span>
            After successful submission, save your{" "}
            <strong className="font-semibold">Request ID</strong> and{" "}
            <strong className="font-semibold">Tracking Token</strong>. They
            are required to track your renewal status later.
          </span>
        </li>
      </ul>

      <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 dark:border-amber-800/50 dark:bg-amber-950/30">
        <span aria-hidden="true" className="shrink-0">
          ⚠️
        </span>
        <p className="text-xs text-amber-800 dark:text-amber-300">
          Using a different email address, mobile number, or an incorrect
          course name may{" "}
          <strong className="font-semibold">
            delay your renewal verification.
          </strong>
        </p>
      </div>
    </div>
  );
}
