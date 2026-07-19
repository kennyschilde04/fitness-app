import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
mkdirSync(publicDir, { recursive: true });

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0a0a0a"/>
  <rect x="136" y="226" width="240" height="60" rx="14" fill="#38bdf8"/>
  <rect x="96" y="176" width="56" height="160" rx="14" fill="#38bdf8"/>
  <rect x="360" y="176" width="56" height="160" rx="14" fill="#38bdf8"/>
</svg>
`;

const sizes = [192, 512];

for (const size of sizes) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, `pwa-${size}.png`));
  console.log(`generated pwa-${size}.png`);
}

await sharp(Buffer.from(svg)).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
console.log('generated apple-touch-icon.png');
