const IMGBB_API_KEY = "04c0280a69c2c685602a6996bcf038c2";

export interface ImgbbUploadResult {
  success: boolean;
  url?: string;
  deleteUrl?: string;
  originalSize?: number;
  avifSize?: number;
  savedPercent?: number;
  mime?: string;
  error?: string;
}

/**
 * Client-side Canvas AVIF Converter
 * Converts any image file in browser into an AVIF blob
 */
export async function convertFileToAvif(file: File, quality: number = 0.8, maxWidth: number = 1920): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Failed to create canvas context"));
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Check if browser supports image/avif canvas export
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback to webp/jpeg if browser cannot export avif
            canvas.toBlob(
              (fallbackBlob) => {
                if (fallbackBlob) resolve(fallbackBlob);
                else reject(new Error("Canvas conversion failed"));
              },
              "image/webp",
              quality
            );
          }
        },
        "image/avif",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for AVIF conversion"));
    };

    img.src = url;
  });
}

/**
 * Universal Image Uploader:
 * 1. Sends to /api/images/upload for server-side Tinify AVIF conversion & ImgBB upload
 * 2. Fallbacks to client-side canvas AVIF conversion + direct ImgBB upload if server route is unavailable
 */
export async function uploadToImgbb(file: File): Promise<ImgbbUploadResult> {
  try {
    // 1. Try Next.js Server API with Tinify AVIF engine
    const formData = new FormData();
    formData.append("image", file);

    const apiRes = await fetch("/api/images/upload", {
      method: "POST",
      body: formData,
    });

    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (apiData.success && apiData.url) {
        return apiData;
      }
    }
  } catch (apiErr) {
    console.warn("API upload fallback triggered:", apiErr);
  }

  // 2. Client-side Fallback: Canvas AVIF conversion + direct ImgBB upload
  try {
    let uploadPayload: Blob | File = file;
    try {
      const avifBlob = await convertFileToAvif(file, 0.8, 1920);
      uploadPayload = avifBlob;
    } catch (cErr) {
      console.warn("Client canvas conversion skipped:", cErr);
    }

    const directFormData = new FormData();
    directFormData.append("image", uploadPayload, file.name.replace(/\.[^.]+$/, ".avif"));

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: directFormData,
    });

    const data = await res.json();
    if (!data.success) {
      return {
        success: false,
        error: data?.error?.message || "Direct image upload failed",
      };
    }

    return {
      success: true,
      url: data.data.url,
      deleteUrl: data.data.delete_url,
      mime: "image/avif",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error uploading image",
    };
  }
}
