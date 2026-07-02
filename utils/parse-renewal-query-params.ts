import { RENEWAL_DURATIONS, type RenewalDuration } from "@/types/renewal";

export type RenewalPrefill = {
  course?: string;
  renewalDuration?: RenewalDuration;
  amount?: number;
};

/**
 * Validates and sanitises the URL query parameters that the Civilezy website
 * appends after a successful Razorpay payment. Returns only the fields that
 * pass validation — invalid or missing fields are silently omitted so the
 * form still opens normally when no (or partial) params are present.
 *
 * SECURITY NOTE: these values are placed into form defaultValues only.
 * They are never trusted server-side — all submitted data goes through the
 * same Zod validation in /api/create-renewal regardless of origin.
 */
export function parseRenewalQueryParams(
  params: URLSearchParams,
): RenewalPrefill {
  const prefill: RenewalPrefill = {};

  // course — must be a non-empty string after trimming
  const rawCourse = params.get("course");
  if (rawCourse) {
    const course = rawCourse.trim();
    if (course.length >= 2) {
      prefill.course = course;
    }
  }

  // duration — must be one of the four valid enum values
  const rawDuration = params.get("duration");
  if (rawDuration) {
    const duration = rawDuration.trim() as RenewalDuration;
    if ((RENEWAL_DURATIONS as readonly string[]).includes(duration)) {
      prefill.renewalDuration = duration;
    }
  }

  // amount — must parse to a finite positive number
  const rawAmount = params.get("amount");
  if (rawAmount) {
    const amount = Number(rawAmount.trim());
    if (Number.isFinite(amount) && amount > 0) {
      prefill.amount = amount;
    }
  }

  return prefill;
}

/** Returns true when at least one prefill field was successfully parsed. */
export function hasPrefill(prefill: RenewalPrefill): boolean {
  return (
    prefill.course !== undefined ||
    prefill.renewalDuration !== undefined ||
    prefill.amount !== undefined
  );
}
