/**
 * Recorta os 5 avatares temáticos do Rill a partir do sprite sheet.
 * Uso: node scripts/split-rill-avatars.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const INPUT = path.join(
  ROOT,
  'public/assets/branding/rill/rill-avatars-sheet.png',
);
const OUTPUT_DIR = path.join(ROOT, 'public/assets/branding/rill');

const AVATARS = [
  { id: 'chef', col: 0, row: 0 },
  { id: 'astronaut', col: 1, row: 0 },
  { id: 'coder', col: 2, row: 0 },
  { id: 'artist', col: 0, row: 1 },
  { id: 'musician', col: 2, row: 1 },
];

async function main() {
  if (!fs.existsSync(INPUT)) {
    throw new Error(`Sprite sheet não encontrado: ${INPUT}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const image = sharp(INPUT);
  const { width, height } = await image.metadata();

  if (!width || !height) {
    throw new Error('Não foi possível ler dimensões da imagem.');
  }

  const cellWidth = Math.floor(width / 3);
  const cellHeight = Math.floor(height / 2);

  for (const avatar of AVATARS) {
    const left = avatar.col * cellWidth;
    const top = avatar.row * cellHeight;
    const output = path.join(OUTPUT_DIR, `rill-avatar-${avatar.id}.png`);

    await sharp(INPUT)
      .extract({
        left,
        top,
        width: cellWidth,
        height: cellHeight,
      })
      .trim({ threshold: 12 })
      .png()
      .toFile(output);

    console.log(`✓ ${output}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
