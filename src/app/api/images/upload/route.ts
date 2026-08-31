import { NextRequest, NextResponse } from "next/server";

const TINIFY_API_KEY = process.env.TINIFY_API_KEY || "YWgrHH4TQxFWcmtRRhb1xzSRqP69CWWF";
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || "04c0280a69c2c685602a6996bcf038c2";

export const dynamic = "force-dynamic";

/**
 * POST /api/images/upload
 * 1. Accepts uploaded image (PNG / JPEG / WebP / etc.)
 * 2. Compresses & converts to AVIF using Tinify API
 * 3. Uploads the compressed AVIF directly to ImgBB
 * 4. Returns the ImgBB AVIF URL
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const originalSize = inputBuffer.length;

    let finalAvifBuffer: Buffer = inputBuffer;
    let conversionType = file.type;
    let convertedVia = "original";

    // 1. Convert & Shrink to AVIF using Tinify API
    try {
      const authHeader = "Basic " + Buffer.from(`api:${TINIFY_API_KEY}`).toString("base64");

      const tinifyShrinkRes = await fetch("https://api.tinify.com/shrink", {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: inputBuffer,
      });

      if (tinifyShrinkRes.ok) {
        const tinifyData = await tinifyShrinkRes.json();
        if (tinifyData.output && tinifyData.output.url) {
          // Request conversion to AVIF
          const convertRes = await fetch(tinifyData.output.url, {
            method: "POST",
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              convert: { type: "image/avif" },
            }),
          });

          if (convertRes.ok) {
            const avifArrayBuf = await convertRes.arrayBuffer();
            finalAvifBuffer = Buffer.from(avifArrayBuf);
            conversionType = "image/avif";
            convertedVia = "tinify";
          }
        }
      } else {
        console.warn("Tinify shrink non-OK status:", tinifyShrinkRes.status);
      }
    } catch (tinifyErr) {
      console.warn("Tinify processing error, fallback to sharp:", tinifyErr);
    }

    // 2. High-Performance Local Fallback: Sharp AVIF conversion if Tinify was skipped/failed
    if (convertedVia !== "tinify") {
      try {
        const sharp = (await import("sharp")).default;
        const sharpAvif = await sharp(inputBuffer)
          .avif({ quality: 80, effort: 4 })
          .toBuffer();
        if (sharpAvif && sharpAvif.length > 0) {
          finalAvifBuffer = sharpAvif;
          conversionType = "image/avif";
          convertedVia = "sharp";
        }
      } catch (sharpErr) {
        console.warn("Sharp AVIF fallback error:", sharpErr);
      }
    }

    // 2. Upload to ImgBB
    const base64Image = finalAvifBuffer.toString("base64");
    const imgbbParams = new URLSearchParams();
    imgbbParams.append("image", base64Image);

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: imgbbParams,
    });

    const imgbbData = await imgbbRes.json();

    if (!imgbbData.success) {
      return NextResponse.json(
        {
          success: false,
          error: imgbbData?.error?.message || "Failed to upload to ImgBB",
        },
        { status: 500 }
      );
    }

    const avifSize = finalAvifBuffer.length;
    const compressionRatio = originalSize > 0 ? Math.round((1 - avifSize / originalSize) * 100) : 0;

    return NextResponse.json({
      success: true,
      url: imgbbData.data.url,
      displayUrl: imgbbData.data.display_url,
      deleteUrl: imgbbData.data.delete_url,
      originalSize,
      avifSize,
      savedPercent: compressionRatio,
      mime: conversionType,
    });
  } catch (error: any) {
    console.error("POST /api/images/upload Exception:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
