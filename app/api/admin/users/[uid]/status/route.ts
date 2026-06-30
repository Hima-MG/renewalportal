import { NextResponse, type NextRequest } from "next/server";

import { setUserActive } from "@/lib/firebase/admin-users";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireRole } from "@/lib/firebase/verify-request";
import { setActiveSchema } from "@/lib/validations/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ uid: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(request, ["admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { uid } = await params;
  if (uid === auth.token.uid) {
    return NextResponse.json(
      { error: "You cannot disable your own account." },
      { status: 400 },
    );
  }

  const parsed = await parseJsonBody(request, setActiveSchema);
  if (!parsed.ok) return parsed.response;

  const result = await setUserActive(uid, parsed.data.isActive);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ data: null });
}
