import { NextResponse, type NextRequest } from "next/server";

import { removeUserRole, setUserRole } from "@/lib/firebase/admin-users";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireRole } from "@/lib/firebase/verify-request";
import { setRoleSchema } from "@/lib/validations/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ uid: string }> };

const SELF_CHANGE_ERROR =
  "You cannot change your own role. Ask another admin to do this.";

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(request, ["admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { uid } = await params;
  if (uid === auth.token.uid) {
    return NextResponse.json({ error: SELF_CHANGE_ERROR }, { status: 400 });
  }

  const parsed = await parseJsonBody(request, setRoleSchema);
  if (!parsed.ok) return parsed.response;

  const result = await setUserRole(uid, parsed.data.role);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ data: null });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(request, ["admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { uid } = await params;
  if (uid === auth.token.uid) {
    return NextResponse.json({ error: SELF_CHANGE_ERROR }, { status: 400 });
  }

  const result = await removeUserRole(uid);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ data: null });
}
