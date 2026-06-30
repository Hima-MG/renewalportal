import { NextResponse, type NextRequest } from "next/server";

import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { clientIp, isRateLimited } from "@/lib/api/rate-limit";
import { requireRole } from "@/lib/firebase/verify-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
// A little headroom over MAX_SIZE_BYTES for multipart boundary/field
// overhead — rejected purely from the Content-Length header, before the
// body is ever read into memory, so an oversized upload can't be used to
// burn server memory/bandwidth.
const MAX_CONTENT_LENGTH_BYTES = MAX_SIZE_BYTES + 64 * 1024;

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const REQUEST_ID_PATTERN = /^RN-\d{8}$/;
const RATE_LIMIT = { windowMs: 60_000, maxAttempts: 20 };

function fileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["student"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (isRateLimited(`upload:${clientIp(request)}`, RATE_LIMIT)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a minute." },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_CONTENT_LENGTH_BYTES) {
    return NextResponse.json(
      { error: "Image must be 5 MB or smaller." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const file = formData.get("file");
  const requestId = formData.get("requestId");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No image file was provided." },
      { status: 400 },
    );
  }

  if (typeof requestId !== "string" || !REQUEST_ID_PATTERN.test(requestId)) {
    return NextResponse.json(
      { error: "A valid request ID is required." },
      { status: 400 },
    );
  }

  // Both the declared MIME type and the filename extension must agree on
  // an accepted image format — rejects mismatched/spoofed uploads (e.g. an
  // .svg renamed to .png, or a Content-Type that doesn't match the file).
  const extension = fileExtension(file.name);
  if (!ACCEPTED_TYPES.has(file.type) || !ACCEPTED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      { error: "Only JPG, JPEG, PNG, or WEBP images are accepted." },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image must be 5 MB or smaller." },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadImageToCloudinary(buffer, requestId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ data: result.data });
}
