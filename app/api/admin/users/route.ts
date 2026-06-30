import { NextResponse, type NextRequest } from "next/server";

import { createUserWithRole, listUsers } from "@/lib/firebase/admin-users";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { clientIp, isRateLimited } from "@/lib/api/rate-limit";
import { requireRole } from "@/lib/firebase/verify-request";
import { createUserSchema } from "@/lib/validations/user";
import { isUserRole } from "@/types/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = { windowMs: 60_000, maxAttempts: 30 };

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const roleParam = searchParams.get("role");
  const role = isUserRole(roleParam) ? roleParam : "all";

  const result = await listUsers({ search, role });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (isRateLimited(`admin-create-user:${clientIp(request)}`, RATE_LIMIT)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a minute." },
      { status: 429 },
    );
  }

  const parsed = await parseJsonBody(request, createUserSchema);
  if (!parsed.ok) return parsed.response;

  const result = await createUserWithRole(parsed.data);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ data: result.data }, { status: 201 });
}
