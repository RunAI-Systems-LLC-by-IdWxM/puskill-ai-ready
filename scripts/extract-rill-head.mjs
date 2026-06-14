/**
 * Recorta só a cabeça do Rill e gera rill-head.svg com a imagem embutida.
 * Uso: node scripts/extract-rill-head.mjs [input.png]
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const DEFAULT_INPUT = path.join(
  ROOT,
  'public/assets/branding/logo_ia_cognitiva.png',
);
const OUTPUT_DIR = path.join(ROOT, 'public/assets/branding/rill');
const OUTPUT_PNG = path.join(OUTPUT_DIR, 'rill-head.png');
const OUTPUT_SVG = path.join(OUTPUT_DIR, 'rill-head.svg');

async function main() {
  const input = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_INPUT;

  if (!fs.existsSync(input)) {
    throw new Error(`Imagem não encontrada: ${input}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const { width, height } = await sharp(input).metadata();
  if (!width || !height) throw new Error('Dimensões inválidas.');

  const left = Math.max(0, Math.floor((width - width * 0.82) / 2));
  const top = Math.max(0, Math.floor(height * 0.01));
  const cropWidth = Math.min(width - left, Math.floor(width * 0.82));
  const cropHeight = Math.min(height - top, Math.floor(height * 0.55));

  const headBuffer = await sharp(input)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .png()
    .toBuffer();

  const trimmedBuffer = await sharp(headBuffer)
    .trim({ threshold: 10 })
    .png()
    .toBuffer()
    .catch(() => headBuffer);

  fs.writeFileSync(OUTPUT_PNG, trimmedBuffer);

  const meta = await sharp(trimmedBuffer).metadata();
  const cropW = meta.width ?? 1;
  const cropH = meta.height ?? 1;
  const base64 = trimmedBuffer.toString('base64');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${cropW} ${cropH}" fill="none" role="img" aria-label="Rill">
  <image width="${cropW}" height="${cropH}" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,${base64}" />
</svg>
`;

  fs.writeFileSync(OUTPUT_SVG, svg);

  console.log(`✓ ${OUTPUT_PNG}`);
  console.log(`✓ ${OUTPUT_SVG} (${cropW}x${cropH})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
