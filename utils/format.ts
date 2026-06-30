import type { Timestamp } from "firebase/firestore";

export type DateInput = Timestamp | string | number | null | undefined;

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Accepts either a client-SDK Firestore Timestamp (dashboard, live data) or
// an ISO date string (the /api/track response, which JSON-serializes dates).
export function timestampToDate(input: DateInput): Date | null {
  if (!input) return null;
  if (typeof input === "string" || typeof input === "number") {
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return input.toDate();
}

export function formatDate(input: DateInput): string {
  const date = timestampToDate(input);
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(input: DateInput): string {
  const date = timestampToDate(input);
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(input: DateInput): boolean {
  const date = timestampToDate(input);
  return date ? isSameDay(date, new Date()) : false;
}

export function isThisWeek(input: DateInput): boolean {
  const date = timestampToDate(input);
  if (!date) return false;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return date >= startOfWeek && date <= now;
}
