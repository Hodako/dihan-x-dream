/**
 * Dream Fashion - Convert all remote & seed images into local AVIF files
 * Run: node scripts/download-and-convert-all-avif.mjs
 */

import sharp from "sharp";
import { mkdirSync, writeFileSync, existsSync, statSync } from "fs";
import { join } from "path";
import https from "https";
import http from "http";

const IMAGES_TO_CONVERT = [
  // Categories
  {
    url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
    outDir: "public/images/categories",
    outFile: "men.avif",
    width: 800,
  },
  {
    url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    outDir: "public/images/categories",
    outFile: "casual-shirts.avif",
    width: 800,
  },
  {
    url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80",
    outDir: "public/images/categories",
    outFile: "polos.avif",
    width: 800,
  },
  {
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    outDir: "public/images/categories",
    outFile: "women.avif",
    width: 800,
  },
  {
    url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
    outDir: "public/images/categories",
    outFile: "dresses.avif",
    width: 800,
  },
  {
    url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=80",
    outDir: "public/images/categories",
    outFile: "outerwear.avif",
    width: 800,
  },

  // Trending Tiles
  {
    url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=85",
    outDir: "public/images/tiles",
    outFile: "tile-polo.avif",
    width: 600,
  },
  {
    url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=85",
    outDir: "public/images/tiles",
    outFile: "tile-half-sleeve.avif",
    width: 600,
  },
  {
    url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=85",
    outDir: "public/images/tiles",
    outFile: "tile-old-money.avif",
    width: 600,
  },
  {
    url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=85",
    outDir: "public/images/tiles",
    outFile: "tile-shirt.avif",
    width: 600,
  },

  // Lookbook
  {
    url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&auto=format&fit=crop&q=85",
    outDir: "public/images/lookbook",
    outFile: "look-1.avif",
    width: 900,
  },
  {
    url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=85",
    outDir: "public/images/lookbook",
    outFile: "look-2.avif",
    width: 800,
  },
  {
    url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=85",
    outDir: "public/images/lookbook",
    outFile: "look-3.avif",
    width: 800,
  },

  // Fallback Product Placeholder
  {
    url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
    outDir: "public/images/placeholders",
    outFile: "product-placeholder.avif",
    width: 800,
  },
];

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}, status: ${res.statusCode}`));
      }
      const data = [];
      res.on("data", (chunk) => data.push(chunk));
      res.on("end", () => resolve(Buffer.concat(data)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function main() {
  console.log("🚀 Starting batch download and AVIF conversion for all remaining images...");

  for (const item of IMAGES_TO_CONVERT) {
    if (!existsSync(item.outDir)) {
      mkdirSync(item.outDir, { recursive: true });
    }

    const targetPath = join(item.outDir, item.outFile);
    console.log(`⬇️ Downloading & converting: ${item.outFile}...`);

    try {
      const buffer = await downloadBuffer(item.url);
      await sharp(buffer)
        .resize({ width: item.width, withoutEnlargement: true })
        .avif({ quality: 62, effort: 6 })
        .toFile(targetPath);

      const size = statSync(targetPath).size;
      console.log(`✅ Saved ${targetPath} (${(size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`❌ Error processing ${item.outFile}:`, err.message);
    }
  }

  console.log("\n🎉 All images successfully converted to local AVIF!");
}

main().catch(console.error);
