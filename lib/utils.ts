import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Shared by every Firebase service wrapper (client and Admin SDK alike) so
// ServiceResult<T> error messages are produced consistently in one place.
export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error occurred.";
}
