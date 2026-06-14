import {
  CATALOG_REQUIRED_FIELDS,
  PUSKILL_CATALOG_BRAND,
  PUSKILL_CATALOG_LINES,
  type CatalogRecord,
  type CatalogRecordInput,
} from '@/lib/catalog/ram/types';
import { normalizeRamRecordInput } from '@/lib/catalog/ram/normalize';
import { buildCatalogChunkText } from '@/lib/catalog/ram/chunk';

const ID_PATTERN =
  /^PUSKILL-(VENENO|KILLBLADE|FUSE|DIAMOND)-[A-Z0-9-]+$/i;

const LINE_TYPE_MAP: Record<string, string> = {
  DDR3: 'VENENO',
  DDR3L: 'VENENO',
  DDR4: 'KILLBLADE',
  'DDR4-RGB': 'KILLBLADE',
  'DDR4-HEATSINK': 'KILLBLADE',
  DDR5: 'FUSE',
  'DDR5-ECC': 'FUSE',
  'SSD-SATA': 'DIAMOND',
  'SSD-SATA-ENDURANCE': 'DIAMOND',
  'NVME-PCIE': 'DIAMOND',
  'NVME-PCIE-GAMING': 'DIAMOND',
};

const SODIMM_PINS = new Set([204, 260, 262]);
const DIMM_PINS = new Set([240, 288]);

function isStorageType(type: string): boolean {
  return /SSD|NVME|SATA/i.test(type);
}

function getFormatFamily(format: string): 'SODIMM' | 'DIMM' | 'OTHER' {
  const upper = format.toUpperCase();
  if (upper.includes('SODIMM')) return 'SODIMM';
  if (
    upper.includes('DIMM') ||
    upper.includes('UDIMM') ||
    upper === 'DIMM'
  ) {
    return 'DIMM';
  }
  return 'OTHER';
}

function validatePins(
  format: string,
  pins: number | null,
  type: string,
): string[] {
  if (pins === null || isStorageType(type)) return [];
  const family = getFormatFamily(format);
  const warnings: string[] = [];

  if (family === 'SODIMM' && !SODIMM_PINS.has(pins)) {
    warnings.push(
      `format=${format} (SODIMM) com pins=${pins}; esperado 204, 260 ou 262`,
    );
  }
  if (family === 'DIMM' && !DIMM_PINS.has(pins)) {
    warnings.push(
      `format=${format} (DIMM/UDIMM) com pins=${pins}; esperado 240 ou 288`,
    );
  }
  return warnings;
}

function validateLineType(line: string, type: string): string[] {
  const baseType = type.split('-')[0];
  const expected = LINE_TYPE_MAP[type] ?? LINE_TYPE_MAP[baseType];
  if (!expected || expected === line) return [];
  return [`line=${line} incompatível com type=${type}; esperado ${expected}`];
}

function validateVoltage(type: string, voltage: number | null): string[] {
  if (voltage === null || isStorageType(type)) return [];
  const warnings: string[] = [];
  const base = type.split('-')[0];

  if (base === 'DDR3' && voltage !== 1.5) {
    warnings.push(`DDR3 com voltage_v=${voltage}; tipicamente 1.5`);
  }
  if (base === 'DDR3L' && voltage !== 1.35) {
    warnings.push(`DDR3L com voltage_v=${voltage}; tipicamente 1.35`);
  }
  if (base === 'DDR4' && voltage !== 1.2 && voltage !== 1.35) {
    warnings.push(`DDR4 com voltage_v=${voltage}; tipicamente 1.2 ou 1.35`);
  }
  if (base === 'DDR5' && voltage !== 1.1 && voltage !== 1.4) {
    warnings.push(`DDR5 com voltage_v=${voltage}; tipicamente 1.1 ou 1.4`);
  }
  return warnings;
}

export type ValidationResult =
  | { ok: true; record: CatalogRecordInput; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[]; partial?: Partial<CatalogRecordInput> };

export function validateCatalogRecordInput(
  raw: Record<string, unknown>,
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const normalized = normalizeRamRecordInput(raw);

  for (const field of CATALOG_REQUIRED_FIELDS) {
    if (!(field in raw)) {
      errors.push(`campo obrigatório ausente: ${field}`);
    }
  }

  const id = normalized.id;
  if (!id) {
    errors.push('id inválido ou ausente');
  } else if (!ID_PATTERN.test(id)) {
    warnings.push(
      `id=${id} não segue o padrão sugerido PUSKILL-<LINE>-<TYPE>-<FORMAT>-<CAPACITY>-<FREQ>`,
    );
  }

  if (normalized.brand !== PUSKILL_CATALOG_BRAND) {
    errors.push(`brand deve ser ${PUSKILL_CATALOG_BRAND}, recebido: ${normalized.brand ?? 'null'}`);
  }

  const line = normalized.line;
  if (!line || !PUSKILL_CATALOG_LINES.includes(line as (typeof PUSKILL_CATALOG_LINES)[number])) {
    errors.push(
      `line deve ser uma de ${PUSKILL_CATALOG_LINES.join(', ')}, recebido: ${line ?? 'null'}`,
    );
  }

  if (normalized.capacity_gb == null || normalized.capacity_gb <= 0) {
    errors.push('capacity_gb deve ser um número positivo');
  }

  const requiredStrings: Array<keyof CatalogRecordInput> = [
    'format',
    'type',
    'chips',
    'application',
    'warranty',
    'packaging',
    'certifications',
    'notes',
    'source_doc',
  ];

  for (const field of requiredStrings) {
    const value = normalized[field];
    if (value == null || value === '') {
      errors.push(`${field} não pode ser vazio`);
    }
  }

  if (normalized.type && line) {
    warnings.push(...validateLineType(line, normalized.type));
  }
  if (normalized.format && normalized.pins != null && normalized.type) {
    warnings.push(
      ...validatePins(normalized.format, normalized.pins, normalized.type),
    );
  }
  if (normalized.type && normalized.voltage_v !== undefined) {
    warnings.push(
      ...validateVoltage(normalized.type, normalized.voltage_v ?? null),
    );
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings, partial: normalized };
  }

  return {
    ok: true,
    warnings,
    record: normalized as CatalogRecordInput,
  };
}

export function finalizeCatalogRecord(
  input: CatalogRecordInput,
  warnings: string[],
  ingestTimestamp: string,
): CatalogRecord {
  return {
    ...input,
    ingest_timestamp: ingestTimestamp,
    validation_warnings: warnings,
    chunk_text: buildCatalogChunkText(input),
  };
}

export function buildManifest(
  records: CatalogRecord[],
  batchesProcessed: number,
  duplicateIds: string[],
): import('@/lib/catalog/ram/types').CatalogManifest {
  const countByLine: Record<string, number> = {};
  const idsWithWarnings: Array<{ id: string; validation_warnings: string[] }> = [];

  for (const record of records) {
    countByLine[record.line] = (countByLine[record.line] ?? 0) + 1;
    if (record.validation_warnings.length > 0) {
      idsWithWarnings.push({
        id: record.id,
        validation_warnings: record.validation_warnings,
      });
    }
  }

  const sourceDocs = [...new Set(records.map((r) => r.source_doc))];

  return {
    generated_at: new Date().toISOString(),
    source_doc: sourceDocs.join('; '),
    total_records: records.length,
    count_by_line: countByLine,
    ids: records.map((r) => r.id),
    ids_with_warnings: idsWithWarnings,
    duplicate_ids: duplicateIds,
    batches_processed: batchesProcessed,
  };
}
