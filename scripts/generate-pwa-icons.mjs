import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate an elegant SVG for Dream Fashion BD
const generateSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#0A0A0A"/>
  <rect x="${Math.round(size * 0.04)}" y="${Math.round(size * 0.04)}" width="${Math.round(size * 0.92)}" height="${Math.round(size * 0.92)}" rx="${Math.round(size * 0.18)}" stroke="url(#goldGradient)" stroke-width="${Math.max(2, Math.round(size * 0.02))}"/>
  
  <!-- Crown Icon at Top -->
  <path d="M${size * 0.38} ${size * 0.28} L${size * 0.42} ${size * 0.35} L${size * 0.5} ${size * 0.25} L${size * 0.58} ${size * 0.35} L${size * 0.62} ${size * 0.28} L${size * 0.64} ${size * 0.38} L${size * 0.36} ${size * 0.38} Z" fill="url(#goldGradient)"/>

  <!-- DF Monogram Text -->
  <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Cinzel', 'Playfair Display', Georgia, 'Times New Roman', serif" font-weight="900" font-size="${Math.round(size * 0.36)}" fill="url(#goldGradient)" letter-spacing="${Math.round(size * 0.02)}">DF</text>
  
  <!-- Subtitle -->
  <text x="50%" y="78%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="${Math.max(8, Math.round(size * 0.075))}" fill="#E5A700" letter-spacing="${Math.round(size * 0.04)}">DREAM FASHION</text>

  <defs>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE082"/>
      <stop offset="40%" stop-color="#FFB900"/>
      <stop offset="70%" stop-color="#FF9E00"/>
      <stop offset="100%" stop-color="#E5A700"/>
    </linearGradient>
  </defs>
</svg>
`;

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (e) {
    console.log("Sharp not available, generating SVGs directly.");
  }

  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

  for (const size of sizes) {
    const svgContent = generateSvg(size);
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    fs.writeFileSync(svgPath, svgContent);

    if (sharp) {
      const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      await sharp(Buffer.from(svgContent)).png().toFile(pngPath);
    }
  }

  // Generate Apple Touch Icon (180x180)
  const appleSvg = generateSvg(180);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), appleSvg);
  if (sharp) {
    await sharp(Buffer.from(appleSvg)).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
    await sharp(Buffer.from(generateSvg(192))).png().toFile(path.join(publicDir, 'icon-192.png'));
    await sharp(Buffer.from(generateSvg(512))).png().toFile(path.join(publicDir, 'icon-512.png'));
    await sharp(Buffer.from(generateSvg(32))).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  }

  // Favicon SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), generateSvg(64));

  console.log("All PWA icons generated successfully!");
}

main().catch(console.error);
