// scripts/prepare_for_ingest.js
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const LINES = new Set(['VENENO', 'KILLBLADE', 'FUSE', 'DIAMOND']);

function inferTypeFromId(parts) {
  if (parts.includes('DDR3L')) return 'DDR3L';
  if (parts.includes('DDR3')) return 'DDR3';
  if (parts.includes('RGB')) return 'DDR4-RGB';
  if (parts.includes('HEATSINK')) return 'DDR4-HEATSINK';
  if (parts.includes('ECC')) return 'DDR5-ECC';
  if (parts.includes('DDR4')) return 'DDR4';
  if (parts.includes('DDR5')) return 'DDR5';
  if (parts.includes('BLACKDIAMOND')) return 'NVMe-PCIe-GAMING';
  if (parts.includes('ENDURANCE')) return 'SSD-SATA-ENDURANCE';
  if (parts.includes('NVME') || parts.includes('M2')) return 'NVMe-PCIe';
  if (parts.includes('SATA')) return 'SSD-SATA';
  return parts[2] ?? 'UNKNOWN';
}

function inferFormatFromId(parts, type) {
  if (parts.includes('SODIMM')) return 'SODIMM';
  if (parts.includes('UDIMM')) return 'UDIMM';
  if (type.startsWith('SSD-SATA') || parts.includes('SATA')) return 'SATA-2.5';
  if (parts.includes('M2') || parts.includes('NVME')) {
    return parts.includes('128GB') ? 'M.2-2242' : 'M.2-2280';
  }
  if (parts.includes('DIMM') || type.startsWith('DDR')) return 'DIMM';
  return parts[3] ?? 'UNKNOWN';
}

function deriveMetadataFromId(id) {
  const parts = String(id).toUpperCase().split('-');
  if (parts.length < 3 || parts[0] !== 'PUSKILL') return null;
  const line = parts[1];
  if (!LINES.has(line)) return null;
  const type = inferTypeFromId(parts);
  const format = inferFormatFromId(parts, type);
  return { brand: 'PUSKILL', line, format, type };
}

function approxTokens(text) {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

const BLOCKS_DIR = path.join('data', 'catalog', 'ram', 'blocks');

function normalizeLists(obj) {
  if (!obj) return obj;
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === 'string' && obj[k].includes(';')) {
      obj[k] = obj[k]
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
        .join(';');
    }
  }
  return obj;
}

function generateSummary(text, minWords = 150, maxWords = 230) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ');
}

function chunkText(text, chunkWords = 320, overlapWords = 40) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    chunks.push(words.slice(i, i + chunkWords).join(' '));
    if (i + chunkWords >= words.length) break;
    i += chunkWords - overlapWords;
  }
  return chunks;
}

if (!fs.existsSync(BLOCKS_DIR)) {
  console.error('Blocks directory not found:', BLOCKS_DIR);
  process.exit(1);
}

for (const file of fs.readdirSync(BLOCKS_DIR)) {
  if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue;
  const full = path.join(BLOCKS_DIR, file);
  const raw = fs.readFileSync(full, 'utf8');
  const docs = yaml.loadAll(raw);
  const processed = docs.map((b) => {
    const derived = deriveMetadataFromId(b.id);
    if (derived) {
      b.brand = b.brand ?? derived.brand;
      b.line = b.line ?? derived.line;
      b.format = b.format ?? derived.format;
      b.type = b.type ?? derived.type;
    }

    b.specs_table = normalizeLists(b.specs_table || {});
    b.description_long = (b.description_long || '').trim();
    b.summary_for_index =
      (b.summary_for_index || '').trim() ||
      generateSummary(b.description_long);
    b.validation_warnings = [];

    const fmt = (b.format || '').toLowerCase();
    const pins = b.specs_table.pins;
    if (fmt.includes('sodimm') && pins && ![204, 260, 262].includes(pins)) {
      b.validation_warnings.push('pins_mismatch_for_SODIMM');
    }
    const isDesktopDimm =
      fmt.includes('udimm') ||
      (fmt.includes('dimm') && !fmt.includes('sodimm'));
    if (isDesktopDimm && pins && ![240, 288].includes(pins)) {
      b.validation_warnings.push('pins_mismatch_for_DIMM');
    }

    b._chunks = chunkText(b.description_long, 320, 40);

    return b;
  });

  const out = processed.map((d) => '---\n' + yaml.dump(d)).join('\n');
  fs.writeFileSync(full, out, 'utf8');
  console.log('Prepared', full, `(${processed.length} blocks)`);
}

console.log('Preparation complete.');
