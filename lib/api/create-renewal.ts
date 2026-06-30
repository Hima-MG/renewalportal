"use client";

import { auth } from "@/lib/firebase/auth";
import type { ServiceResult } from "@/types/result";
import type { CreateRenewalRequestBody } from "@/lib/validations/create-renewal";

export type CreateRenewalResult = {
  requestId: string;
  trackingToken: string;
};

// The only client entry point for creating a renewal request. Request ID
// generation (counters/*) and the Firestore write both happen server-side
// in app/api/create-renewal — this just submits the form fields plus the
// already-uploaded screenshot's Cloudinary metadata.
export async function createRenewal(
  body: CreateRenewalRequestBody,
): Promise<ServiceResult<CreateRenewalResult>> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    return { success: false, error: "You're not signed in. Please retry." };
  }

  try {
    const response = await fetch("/api/create-renewal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(body),
    });

    const json = (await response.json().catch(() => null)) as {
      data?: CreateRenewalResult;
      error?: string;
    } | null;

    if (!response.ok || !json?.data) {
      return {
        success: false,
        error:
          json?.error ?? "Could not submit your renewal. Please try again.",
      };
    }

    return { success: true, data: json.data };
  } catch {
    return {
      success: false,
      error: "Network error. Check your connection and try again.",
    };
  }
}
