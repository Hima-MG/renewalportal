import { NextResponse, type NextRequest } from "next/server";

import {
  createRenewalDocumentAdmin,
  findRenewalByTransactionId,
  generateRequestIdAdmin,
} from "@/lib/firebase/admin-renewals";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { clientIp, isRateLimited } from "@/lib/api/rate-limit";
import { requireRole } from "@/lib/firebase/verify-request";
import { createRenewalRequestSchema } from "@/lib/validations/create-renewal";
import { generateTrackingToken } from "@/utils/tracking-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = { windowMs: 60_000, maxAttempts: 10 };

// The single, server-controlled entry point for creating a renewal_requests
// document. Request ID generation (the counters/* transaction), tracking
// token generation, and the Firestore write all happen here via the Admin
// SDK — the client never touches counters/*, never assigns its own
// requestId, and never writes renewal_requests directly. createdBy /
// updatedBy / studentUid are taken from the verified ID token, never from
// the request body, so a client can't spoof another student's identity.
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["student"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (isRateLimited(`create-renewal:${clientIp(request)}`, RATE_LIMIT)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a minute." },
      { status: 429 },
    );
  }

  const parsed = await parseJsonBody(request, createRenewalRequestSchema);
  if (!parsed.ok) return parsed.response;

  const uid = auth.token.uid;

  const duplicateCheck = await findRenewalByTransactionId(
    parsed.data.transactionId,
  );
  if (duplicateCheck.success && duplicateCheck.data) {
    return NextResponse.json(
      {
        error:
          "This transaction ID has already been submitted. Track your existing request instead of submitting again.",
      },
      { status: 409 },
    );
  }

  const requestIdResult = await generateRequestIdAdmin();
  if (!requestIdResult.success) {
    console.error(
      "[create-renewal] Failed to generate request ID:",
      requestIdResult.error,
    );
    return NextResponse.json(
      { error: "Could not generate a request number. Please try again." },
      { status: 500 },
    );
  }
  const requestId = requestIdResult.data;
  const trackingToken = generateTrackingToken();

  const createResult = await createRenewalDocumentAdmin(requestId, {
    ...parsed.data,
    email: parsed.data.email ?? null,
    trackingToken,
    studentUid: uid,
    createdBy: uid,
    updatedBy: uid,
  });

  if (!createResult.success) {
    console.error(
      "[create-renewal] Failed to write renewal document:",
      createResult.error,
    );
    return NextResponse.json(
      { error: "Could not submit your renewal. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { requestId, trackingToken } });
}
