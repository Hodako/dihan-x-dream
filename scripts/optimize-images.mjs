/**
 * Dream Fashion - Image Optimizer Script
 * Converts all static JPEG/PNG images in public/ to AVIF format.
 * Run: node scripts/optimize-images.mjs
 */

import sharp from "sharp";
import { readdirSync, statSync, existsSync } from "fs";
import { join, extname, basename, dirname } from "path";

const PUBLIC_DIR = "public";
const AVIF_QUALITY = 62;
const JPEG_QUALITY = 80;

function walkDir(dir) {
  const results = [];
  for (const file of readdirSync(dir)) {
    const full = join(dir, file);
    if (statSync(full).isDirectory()) {
      results.push(...walkDir(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const CONVERTIBLE_EXT = [".jpg", ".jpeg", ".png"];
const files = walkDir(PUBLIC_DIR).filter((f) =>
  CONVERTIBLE_EXT.includes(extname(f).toLowerCase())
);

let totalSaved = 0;

for (const src of files) {
  const ext = extname(src).toLowerCase();
  const outPath = src.replace(/\.(jpg|jpeg|png)$/i, ".avif");

  if (existsSync(outPath)) {
    console.log(`⏭  Already exists: ${outPath}`);
    continue;
  }

  const beforeSize = statSync(src).size;
  try {
    await sharp(src)
      .resize({ width: 1920, withoutEnlargement: true })
      .avif({ quality: AVIF_QUALITY, effort: 6 })
      .toFile(outPath);

    const afterSize = statSync(outPath).size;
    const saved = beforeSize - afterSize;
    totalSaved += saved;
    const pct = Math.round((1 - afterSize / beforeSize) * 100);
    console.log(`✅ ${src} → ${outPath}  ${(beforeSize / 1024).toFixed(0)}KB → ${(afterSize / 1024).toFixed(0)}KB  (${pct}% smaller)`);
  } catch (err) {
    console.error(`❌ Failed: ${src}`, err.message);
  }
}

console.log(`\n🎉 Done. Total saved: ${(totalSaved / 1024).toFixed(0)} KB`);
