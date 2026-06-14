import type { CatalogRecordInput } from '@/lib/catalog/ram/types';

const MIN_CHUNK_CHARS = 300;
const MAX_CHUNK_CHARS = 3200;

function formatField(label: string, value: string | number | null): string {
  if (value === null || value === undefined || value === '') return '';
  return `${label}: ${value}`;
}

/**
 * Texto de chunk para embeddings (≈300–800 tokens).
 * Prioriza campos estruturados para filtros e recuperação semântica.
 */
export function buildCatalogChunkText(record: CatalogRecordInput): string {
  const parts = [
    formatField('id', record.id),
    formatField('brand', record.brand),
    formatField('line', record.line),
    formatField('type', record.type),
    formatField('format', record.format),
    formatField('capacity_gb', record.capacity_gb),
    formatField('frequency_mhz', record.frequency_mhz),
    formatField('voltage_v', record.voltage_v),
    formatField('pins', record.pins),
    formatField('latency', record.latency),
    formatField('chips', record.chips),
    formatField('application', record.application),
    formatField('warranty', record.warranty),
    formatField('packaging', record.packaging),
    formatField('certifications', record.certifications),
    record.description_short
      ? `description_short: ${record.description_short}`
      : '',
    record.notes ? `notes: ${record.notes}` : '',
    `source_doc: ${record.source_doc}`,
  ].filter(Boolean);

  let text = parts.join('\n');
  if (text.length < MIN_CHUNK_CHARS && record.description_short) {
    text = `${text}\n${record.description_short}`;
  }
  if (text.length > MAX_CHUNK_CHARS) {
    text = `${text.slice(0, MAX_CHUNK_CHARS - 3).trimEnd()}...`;
  }
  return text;
}
