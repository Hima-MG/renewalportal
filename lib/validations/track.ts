import { z } from "zod";

export const trackFormSchema = z.object({
  requestId: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^RN-\d{8}$/, "Enter a valid request ID, e.g. RN-20260001."),
  trackingToken: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{10}$/, "Enter the 10-character tracking token."),
});

export type TrackFormValues = z.infer<typeof trackFormSchema>;
