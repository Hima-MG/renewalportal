import crypto from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { getAdminDb } from "@/lib/firebase/admin";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { clientIp, isRateLimited } from "@/lib/api/rate-limit";
import { trackFormSchema } from "@/lib/validations/track";
import type { TrackedRenewal } from "@/types/renewal";

// Admin SDK requires the Node runtime, and the result must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_ERROR = "Invalid Request ID or Tracking Token";
const RATE_LIMIT = { windowMs: 60_000, maxAttempts: 10 };

// Constant-time string comparison so response timing can't be used to
// brute-force the tracking token one character at a time.
function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  if (isRateLimited(`track:${clientIp(request)}`, RATE_LIMIT)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a minute." },
      { status: 429 },
    );
  }

  const parsed = await parseJsonBody(request, trackFormSchema);
  if (!parsed.ok) return parsed.response;

  const { requestId, trackingToken } = parsed.data;

  try {
    const snapshot = await getAdminDb()
      .collection("renewal_requests")
      .doc(requestId)
      .get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 404 });
    }

    const data = snapshot.data();
    const storedToken =
      typeof data?.trackingToken === "string" ? data.trackingToken : "";

    if (!timingSafeEqual(storedToken, trackingToken)) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 404 });
    }

    const tracked: TrackedRenewal = {
      requestId: snapshot.id,
      studentName: data?.studentName ?? "",
      phone: data?.phone ?? "",
      course: data?.course ?? "",
      // Backward compatibility: older documents stored this as "plan".
      renewalDuration: data?.renewalDuration ?? data?.plan ?? "",
      amount: data?.amount ?? 0,
      transactionId: data?.transactionId ?? "",
      paymentMethod: data?.paymentMethod ?? "",
      screenshotUrl: data?.screenshotUrl ?? "",
      cloudinaryPublicId: data?.cloudinaryPublicId ?? "",
      imageWidth: data?.imageWidth ?? 0,
      imageHeight: data?.imageHeight ?? 0,
      imageBytes: data?.imageBytes ?? 0,
      imageFormat: data?.imageFormat ?? "",
      email: typeof data?.email === "string" ? data.email : null,
      status: data?.status ?? "Pending",
      remarks: data?.remarks ?? "",
      verifiedBy: data?.verifiedBy ?? null,
      completedBy: data?.completedBy ?? null,
      createdAt:
        data?.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
      updatedAt:
        data?.updatedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    };

    return NextResponse.json({ data: tracked });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
