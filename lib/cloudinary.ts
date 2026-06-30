import "server-only";

import crypto from "node:crypto";

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

import type { ServiceResult } from "@/types/result";
import type { CloudinaryUploadResult } from "@/types/cloudinary";

const UPLOAD_FOLDER = "renewal-screenshots";

let configured = false;

function configureCloudinary() {
  if (configured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, " +
        "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  configured = true;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error occurred.";
}

// Builds the delivery URL with auto_format + auto_quality + stripped
// metadata baked in, instead of returning Cloudinary's raw secure_url for
// the untransformed original. This is what actually makes f_auto/q_auto
// apply — they're response-time decisions Cloudinary makes per request
// based on the URL, not something that can be "saved" onto the asset at
// upload time.
function buildOptimizedUrl(publicId: string, format: string): string {
  return cloudinary.url(publicId, {
    secure: true,
    format,
    fetch_format: "auto",
    quality: "auto",
    flags: "strip_profile",
  });
}

// Uploads via the server using the API key/secret (never exposed to the
// browser) while still applying the configured upload preset's settings
// (folder/transformation/tag rules defined in the Cloudinary console).
//
// `uploadId` is just a grouping label for the Cloudinary folder/public_id —
// it is generated client-side before the renewal_requests document (and
// its real, sequential request ID) exists, since uploading now always
// happens before app/api/create-renewal mints the request ID. The public_id
// also gets a server-random suffix and is uploaded with overwrite: false,
// so a retried/duplicated upload can't silently create (and bill) a
// second copy.
export async function uploadImageToCloudinary(
  buffer: Buffer,
  uploadId: string,
): Promise<ServiceResult<CloudinaryUploadResult>> {
  try {
    configureCloudinary();

    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
    if (!uploadPreset) {
      throw new Error("CLOUDINARY_UPLOAD_PRESET is not configured.");
    }

    const publicId = `${uploadId}-${crypto.randomBytes(8).toString("hex")}`;

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          upload_preset: uploadPreset,
          folder: UPLOAD_FOLDER,
          public_id: publicId,
          use_filename: false,
          unique_filename: false,
          overwrite: false,
          resource_type: "image",
          type: "upload",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error("Cloudinary upload failed."));
            return;
          }
          resolve(uploadResult);
        },
      );
      stream.end(buffer);
    });

    // Cloudinary reports pages > 1 for multi-frame assets — i.e. animated
    // WEBP (GIF is already blocked at the MIME/extension allowlist).
    // Reject and clean up rather than storing an animated screenshot.
    if (result.pages && result.pages > 1) {
      await cloudinary.uploader
        .destroy(result.public_id, { resource_type: "image" })
        .catch(() => undefined);
      return {
        success: false,
        error: "Animated images are not accepted. Upload a static image.",
      };
    }

    return {
      success: true,
      data: {
        secureUrl: buildOptimizedUrl(result.public_id, result.format),
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format,
      },
    };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}
