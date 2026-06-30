"use client";

import { auth } from "@/lib/firebase/auth";
import type { ServiceResult } from "@/types/result";
import type { CloudinaryUploadResult } from "@/types/cloudinary";

// Uses XMLHttpRequest (not fetch) so upload progress can be reported —
// fetch has no cross-browser way to observe request-body upload progress.
export async function uploadScreenshot(
  requestId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ServiceResult<CloudinaryUploadResult>> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    return { success: false, error: "You're not signed in. Please retry." };
  }

  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("requestId", requestId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.setRequestHeader("Authorization", `Bearer ${idToken}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let json: { data?: CloudinaryUploadResult; error?: string } | null = null;
      try {
        json = JSON.parse(xhr.responseText) as {
          data?: CloudinaryUploadResult;
          error?: string;
        };
      } catch {
        json = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && json?.data) {
        resolve({ success: true, data: json.data });
      } else {
        resolve({
          success: false,
          error: json?.error ?? "Could not upload the screenshot.",
        });
      }
    };

    xhr.onerror = () => {
      resolve({
        success: false,
        error: "Network error. Check your connection and try again.",
      });
    };

    xhr.send(formData);
  });
}
