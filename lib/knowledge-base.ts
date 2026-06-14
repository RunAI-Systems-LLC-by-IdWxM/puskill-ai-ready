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
] as const;

function formatRecordLine(record: CatalogRecord): string {
  const fields = [
    `id=${record.id}`,
    `line=${record.line}`,
    `type=${record.type}`,
    `format=${record.format}`,
    `capacity_gb=${record.capacity_gb}`,
    record.frequency_mhz != null ? `frequency_mhz=${record.frequency_mhz}` : null,
    record.voltage_v != null ? `voltage_v=${record.voltage_v}` : null,
    record.pins != null ? `pins=${record.pins}` : null,
    record.latency != null ? `latency=${record.latency}` : null,
    `warranty=${record.warranty}`,
    `application=${record.application}`,
    `certifications=${record.certifications}`,
    record.description_short ? `description_short=${record.description_short}` : null,
    `source_doc=${record.source_doc}`,
  ].filter(Boolean);

  return `- ${fields.join(' | ')}`;
}

export function getHardwareCatalogContext(): string {
  const { count_by_line, total_records, ids_with_warnings } =
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
    `Total indexado: ${total_records} SKUs (${linesSummary}).`,
    'Fonte: ingestão YAML — Hardware de computador , RAM.txt',
    '',
    '### Regras de resposta (catálogo)',
    ...CATALOG_RESPONSE_RULES.map((rule) => `- ${rule}`),
    '',
    '### Registros (campos estruturados)',
    ...HARDWARE_CATALOG_RECORDS.map(formatRecordLine),
    ...warningBlock,
  ].join('\n');
}

/** Versão compacta para Edge/Workers — evita prompt excessivo */
export function getHardwareCatalogContextCompact(): string {
  const { count_by_line, total_records, ids } = HARDWARE_CATALOG_MANIFEST;
  const linesSummary = Object.entries(count_by_line)
    .map(([line, count]) => `${line}: ${count}`)
    .join(', ');

  return [
    '## CATÁLOGO CANÔNICO DE HARDWARE PUSKILL (resumo Edge)',
    `Total indexado: ${total_records} SKUs (${linesSummary}).`,
    `IDs: ${ids.join('; ')}`,
    '',
    '### Regras de resposta (catálogo)',
    ...CATALOG_RESPONSE_RULES.map((rule) => `- ${rule}`),
    'Consulte id + campos estruturados por SKU quando necessário.',
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
