import { z } from "zod";

import { RENEWAL_DURATIONS } from "@/types/renewal";

export const MAX_SCREENSHOT_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_SCREENSHOT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const PAYMENT_METHODS = [
  "UPI",
  "Bank Transfer",
  "Debit/Credit Card",
  "Cash",
] as const;

export const renewalFormSchema = z.object({
  studentName: z.string().trim().min(2, "Enter the student's full name."),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number."),
  course: z.string().trim().min(2, "Enter the course name."),
  renewalDuration: z.enum(RENEWAL_DURATIONS, {
    message: "Select a renewal duration.",
  }),
  amount: z
    .number({ message: "Enter the amount paid." })
    .positive("Amount must be greater than 0."),
  transactionId: z.string().trim().min(4, "Enter a valid transaction ID."),
  paymentMethod: z.string().trim().min(1, "Select a payment method."),
  screenshot: z
    .instanceof(File, { message: "Upload a payment screenshot." })
    .refine(
      (file) => file.size <= MAX_SCREENSHOT_SIZE_BYTES,
      "Screenshot must be 5 MB or smaller.",
    )
    .refine(
      (file) =>
        ACCEPTED_SCREENSHOT_TYPES.includes(
          file.type as (typeof ACCEPTED_SCREENSHOT_TYPES)[number],
        ),
      "Only JPG, JPEG, PNG, or WEBP files are accepted.",
    ),
  remarks: z.string().trim().max(500, "Keep notes under 500 characters."),
});

export type RenewalFormValues = z.infer<typeof renewalFormSchema>;
