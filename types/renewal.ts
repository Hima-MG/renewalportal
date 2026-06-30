import type { Timestamp } from "firebase/firestore";

export const RENEWAL_STATUSES = [
  "Pending",
  "Approved",
  "Rejected",
  "Completed",
] as const;

export type RenewalStatus = (typeof RENEWAL_STATUSES)[number];

export type RenewalRequest = {
  requestId: string;
  studentName: string;
  phone: string;
  course: string;
  plan: string;
  amount: number;
  transactionId: string;
  paymentMethod: string;
  // Cloudinary-hosted payment screenshot. Publicly fetchable by URL (same
  // as any Cloudinary delivery URL) — there is no private/signed variant
  // here, unlike the old Firebase Storage path-based approach.
  screenshotUrl: string;
  cloudinaryPublicId: string;
  imageWidth: number;
  imageHeight: number;
  imageBytes: number;
  imageFormat: string;
  status: RenewalStatus;
  remarks: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  verifiedBy: string | null;
  completedBy: string | null;
  // Single-use-by-knowledge secret returned to the student once at
  // submission time. Never exposed by Firestore reads — only the
  // server-side /api/track route (Admin SDK) ever compares it.
  trackingToken: string;
  // uid of the (anonymous) Firebase Auth user that created the request.
  studentUid: string | null;
  createdBy: string;
  updatedBy: string;
};

export type CreateRenewalInput = Omit<
  RenewalRequest,
  | "requestId"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "verifiedBy"
  | "completedBy"
>;

export type UpdateRenewalInput = Partial<
  Pick<
    RenewalRequest,
    "status" | "remarks" | "verifiedBy" | "completedBy" | "updatedBy"
  >
>;

// Sanitized shape returned by /api/track — internal/secret fields
// (trackingToken, createdBy, updatedBy, studentUid) are stripped, and
// timestamps are ISO strings (JSON over the wire has no Timestamp class).
export type TrackedRenewal = Omit<
  RenewalRequest,
  | "trackingToken"
  | "createdBy"
  | "updatedBy"
  | "studentUid"
  | "createdAt"
  | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};
