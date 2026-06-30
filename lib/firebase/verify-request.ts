import "server-only";

import type { NextRequest } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";

import { getAdminAuth } from "@/lib/firebase/admin";
import { isUserRole, type UserRole } from "@/types/user";

type VerifyResult =
  | { ok: true; token: DecodedIdToken }
  | { ok: false; status: number; error: string };

async function verifyBearerToken(request: NextRequest): Promise<VerifyResult> {
  const header = request.headers.get("authorization") ?? "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!idToken) {
    return { ok: false, status: 401, error: "Missing authorization token." };
  }

  try {
    const token = await getAdminAuth().verifyIdToken(idToken, true);
    return { ok: true, token };
  } catch {
    return { ok: false, status: 401, error: "Invalid or expired session." };
  }
}

// Verifies the caller's Firebase ID token and requires their custom claim
// role to be one of `roles`. This — not anything stored in Firestore — is
// the authorization check for every privileged API route.
export async function requireRole(
  request: NextRequest,
  roles: UserRole[],
): Promise<VerifyResult> {
  const result = await verifyBearerToken(request);
  if (!result.ok) return result;

  const role = result.token.role;
  if (!isUserRole(role) || !roles.includes(role)) {
    return { ok: false, status: 403, error: "Forbidden." };
  }

  return result;
}

export async function requireAnonymous(
  request: NextRequest,
): Promise<VerifyResult> {
  const result = await verifyBearerToken(request);
  if (!result.ok) return result;

  if (result.token.firebase.sign_in_provider !== "anonymous") {
    return { ok: false, status: 403, error: "Forbidden." };
  }

  return result;
}
