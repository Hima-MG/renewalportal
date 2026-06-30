import { NextResponse, type NextRequest } from "next/server";

import { getAdminAuth } from "@/lib/firebase/admin";
import { clientIp, isRateLimited } from "@/lib/api/rate-limit";
import { requireAnonymous } from "@/lib/firebase/verify-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = { windowMs: 60_000, maxAttempts: 20 };

// Self-service role claim, intentionally narrow: only an anonymous Firebase
// Auth user can call this, and it can only ever grant 'student' — never
// 'admin' or 'finance'. This is what lets the renewal form's anonymous
// sign-in actually satisfy isStudent() in firestore.rules, without opening
// any path for a client to grant itself a privileged role.
export async function POST(request: NextRequest) {
  if (isRateLimited(`claim-student:${clientIp(request)}`, RATE_LIMIT)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a minute." },
      { status: 429 },
    );
  }

  const auth = await requireAnonymous(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.token.role === "student") {
    return NextResponse.json({ data: null });
  }

  try {
    await getAdminAuth().setCustomUserClaims(auth.token.uid, {
      role: "student",
    });
    return NextResponse.json({ data: null });
  } catch (error) {
    console.error("[claim-student] Failed to set custom claim:", error);
    return NextResponse.json(
      { error: "Could not assign student access. Please try again." },
      { status: 500 },
    );
  }
}
