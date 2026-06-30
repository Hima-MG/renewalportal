import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClassMap: Record<NonNullable<LoadingSpinnerProps["size"]>, string> = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
};

export function LoadingSpinner({
  className,
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn("text-primary animate-spin", sizeClassMap[size], className)}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
