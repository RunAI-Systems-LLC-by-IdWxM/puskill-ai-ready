/**
 * Base de conhecimento canônica PUSKILL — Edge-safe (TS bundle, sem fs/JSON).
 * Registros ingeridos de data/catalog/ram/blocks/*.yaml via scripts/ingest-ram-catalog.ts
 */

import { CATALOG_BUNDLE } from '@/lib/catalog/ram/catalog.generated';
import type { CatalogBundle, CatalogRecord } from '@/lib/catalog/ram/types';

export const HARDWARE_CATALOG = CATALOG_BUNDLE as CatalogBundle;

export const HARDWARE_CATALOG_RECORDS: readonly CatalogRecord[] =
  HARDWARE_CATALOG.records;

export const HARDWARE_CATALOG_MANIFEST = HARDWARE_CATALOG.manifest;

export const CATALOG_RESPONSE_RULES = [
  'Cada registro é canônico e independente — não mesclar campos entre blocos.',
  'Relacionar produtos apenas por id quando necessário.',
  'Citar apenas id e campos estruturados nas respostas automáticas.',
  'PROIBIDO gerar ou inferir preços em USD.',
  'Linhas oficiais: VENENO, KILLBLADE, FUSE, DIAMOND.',
  'DDR3/DDR3L → VENENO | DDR4 → KILLBLADE | DDR5 → FUSE | SSD/NVMe → DIAMOND.',
  'RAG: recuperar summary_for_index + specs_table; anexar 1 embedding_chunk se necessário.',
  'Reindexar embeddings somente quando last_updated mudar.',
] as const;

function formatSpecsTable(record: CatalogRecord): string {
  const s = record.specs_table;
  return [
    `capacity_gb=${s.capacity_gb}`,
    s.frequency_mhz != null ? `frequency_mhz=${s.frequency_mhz}` : null,
    s.voltage_v != null ? `voltage_v=${s.voltage_v}` : null,
    s.pins != null ? `pins=${s.pins}` : null,
    s.latency != null ? `latency=${s.latency}` : null,
    `chips=${s.chips}`,
    `application=${s.application}`,
    `warranty=${s.warranty}`,
    `packaging=${s.packaging}`,
    `certifications=${s.certifications}`,
  ]
    .filter(Boolean)
    .join(' | ');
}

function formatRecordLine(record: CatalogRecord): string {
  const fields = [
    `id=${record.id}`,
    `title=${record.title}`,
    `line=${record.line}`,
    `type=${record.type}`,
    `format=${record.format}`,
    formatSpecsTable(record),
    `summary_for_index=${record.summary_for_index}`,
    `meta_description=${record.meta_description}`,
    `last_updated=${record.last_updated}`,
    `source_doc=${record.source_doc}`,
  ].filter(Boolean);

  return `- ${fields.join(' | ')}`;
}

export function getHardwareCatalogContext(): string {
  const { count_by_line, total_skus, ids_with_warnings } =
    HARDWARE_CATALOG_MANIFEST;

  const linesSummary = Object.entries(count_by_line)
    .map(([line, count]) => `${line}: ${count}`)
    .join(', ');

  const warningBlock =
    ids_with_warnings.length > 0
      ? [
          '### IDs com validation_warnings',
          ...ids_with_warnings.map(
            (entry) =>
              `- ${entry.id}: ${entry.validation_warnings.join('; ')}`,
          ),
        ]
      : [];

  return [
    '## CATÁLOGO CANÔNICO DE HARDWARE PUSKILL',
    `Total indexado: ${total_skus} SKUs (${linesSummary}).`,
    'Fonte: ingestão YAML v2 — Hardware de computador , RAM.txt',
    '',
    '### Regras de resposta (catálogo)',
    ...CATALOG_RESPONSE_RULES.map((rule) => `- ${rule}`),
    '',
    '### Registros (summary_for_index + specs_table)',
    ...HARDWARE_CATALOG_RECORDS.map(formatRecordLine),
    ...warningBlock,
  ].join('\n');
}

/** Versão compacta para Edge/Workers — evita prompt excessivo */
export function getHardwareCatalogContextCompact(): string {
  const { count_by_line, total_skus, ids } = HARDWARE_CATALOG_MANIFEST;
  const linesSummary = Object.entries(count_by_line)
    .map(([line, count]) => `${line}: ${count}`)
    .join(', ');

  return [
    '## CATÁLOGO CANÔNICO DE HARDWARE PUSKILL (resumo Edge)',
    `Total indexado: ${total_skus} SKUs (${linesSummary}).`,
    `IDs: ${ids.join('; ')}`,
    '',
    '### Regras de resposta (catálogo)',
    ...CATALOG_RESPONSE_RULES.map((rule) => `- ${rule}`),
    'Consulte id + summary_for_index + specs_table por SKU quando necessário.',
  ].join('\n');
}

export function findCatalogRecordById(id: string): CatalogRecord | undefined {
  return HARDWARE_CATALOG_RECORDS.find((record) => record.id === id);
}

export function getCatalogRecordsByLine(line: string): CatalogRecord[] {
  const normalized = line.toUpperCase();
  return HARDWARE_CATALOG_RECORDS.filter(
    (record) => record.line === normalized,
  );
}

/** Texto para embedding: summary_for_index + metadados chave (chunk_text canônico) */
export function getEmbeddingTextForRecord(record: CatalogRecord): string {
  return record.chunk_text;
}

/** Fallback RAG: primeiro chunk de description_long */
export function getRagFallbackChunk(record: CatalogRecord): string | undefined {
  return record.embedding_chunks[0];
}
