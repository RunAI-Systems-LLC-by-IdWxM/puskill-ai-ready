import type { CatalogRecordInput } from '@/lib/catalog/ram/types';

const MIN_CHUNK_CHARS = 200;
const MAX_CHUNK_CHARS = 3200;
const CHUNK_WORDS = 320;
const CHUNK_OVERLAP_WORDS = 40;

function formatField(label: string, value: string | number | null): string {
  if (value === null || value === undefined || value === '') return '';
  return `${label}: ${value}`;
}

/** Chunks de description_long para fallback RAG (≈300–350 tokens com sobreposição) */
export function buildEmbeddingChunks(
  text: string,
  chunkWords = CHUNK_WORDS,
  overlapWords = CHUNK_OVERLAP_WORDS,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    chunks.push(words.slice(i, i + chunkWords).join(' '));
    if (i + chunkWords >= words.length) break;
    i += chunkWords - overlapWords;
  }
  return chunks;
}

/**
 * Texto principal para embeddings: summary_for_index + metadados YAML chave.
 * Prioriza campos estruturados para filtros e recuperação semântica.
 */
export function buildCatalogChunkText(record: CatalogRecordInput): string {
  const parts = [
    formatField('id', record.id),
    formatField('slug', record.slug),
    formatField('title', record.title),
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
    record.summary_for_index
      ? `summary_for_index: ${record.summary_for_index}`
      : '',
    record.meta_description
      ? `meta_description: ${record.meta_description}`
      : '',
    `source_doc: ${record.source_doc}`,
    `last_updated: ${record.last_updated}`,
  ].filter(Boolean);

  let text = parts.join('\n');
  if (text.length < MIN_CHUNK_CHARS && record.summary_for_index) {
    text = `${text}\n${record.summary_for_index}`;
  }
  if (text.length > MAX_CHUNK_CHARS) {
    text = `${text.slice(0, MAX_CHUNK_CHARS - 3).trimEnd()}...`;
  }
  return text;
}
