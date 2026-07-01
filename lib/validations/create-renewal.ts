import { z } from "zod";

import { PAYMENT_METHODS } from "@/lib/validations/renewal";
import { RENEWAL_DURATIONS } from "@/types/renewal";

// The screenshot must already be uploaded (via /api/upload) before this
// route is called — these fields are that upload's response, not a raw
// file. The hostname/prefix checks are defense-in-depth: they don't
// re-verify the asset exists, but they do stop a client from pointing a
// renewal document at an arbitrary off-Cloudinary URL.
export const createRenewalRequestSchema = z.object({
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
  paymentMethod: z.enum(PAYMENT_METHODS, {
    message: "Select a payment method.",
  }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .optional()
    .or(z.literal("")),
  remarks: z.string().trim().max(500, "Keep notes under 500 characters."),
  screenshotUrl: z
    .url("Invalid screenshot URL.")
    .refine(
      (url) => new URL(url).hostname === "res.cloudinary.com",
      "Screenshot must be a Cloudinary-hosted URL.",
    ),
  cloudinaryPublicId: z
    .string()
    .trim()
    .min(1)
    .refine(
      (id) => id.startsWith("renewal-screenshots/"),
      "Invalid screenshot reference.",
    ),
  imageWidth: z.number().positive(),
  imageHeight: z.number().positive(),
  imageBytes: z.number().positive(),
  imageFormat: z.string().trim().min(1),
});

export type CreateRenewalRequestBody = z.infer<
  typeof createRenewalRequestSchema
>;
