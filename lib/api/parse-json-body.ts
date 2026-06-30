import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import type { ZodType } from "zod";

type ParseResult<T> =
  { ok: true; data: T } | { ok: false; response: NextResponse };

// Shared by every Route Handler that accepts a JSON body: parses the body,
// validates it against `schema`, and returns a ready-to-send 400 response
// on either failure so callers don't repeat the same try/catch + safeParse
// boilerplate.
export async function parseJsonBody<T>(
  request: NextRequest,
  schema: ZodType<T>,
): Promise<ParseResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid request." },
        { status: 400 },
      ),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
