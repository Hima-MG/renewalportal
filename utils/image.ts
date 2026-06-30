const MAX_COMPRESSED_BYTES = 1 * 1024 * 1024;
const MAX_DIMENSION = 1920;

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not read image file."));
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  quality: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image compression failed."));
          return;
        }
        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      quality,
    );
  });
}

// Downscales and re-encodes an image as JPEG, iterating on quality until the
// result is under maxBytes (defaults to 1 MB) so uploads stay fast and cheap.
export async function compressImage(
  file: File,
  maxBytes: number = MAX_COMPRESSED_BYTES,
): Promise<File> {
  if (file.size <= maxBytes) return file;

  const image = await loadImage(file);
  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(image.width, image.height),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.9;
  let result = await canvasToFile(canvas, file.name, quality);

  while (result.size > maxBytes && quality > 0.3) {
    quality -= 0.1;
    result = await canvasToFile(canvas, file.name, quality);
  }

  return result.size < file.size ? result : file;
}
