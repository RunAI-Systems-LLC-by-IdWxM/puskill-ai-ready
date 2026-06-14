import { deriveMetadataFromId } from '@/lib/catalog/ram/derive-metadata';
import type { CatalogRecordInput, CatalogSpecsTable } from '@/lib/catalog/ram/types';

const USD_PRICE_PATTERN =
  /\$\s*\d+(?:[.,]\d+)?|\bUSD\s*\d+(?:[.,]\d+)?|\b\d+(?:[.,]\d+)?\s*(?:USD|usd|dólares?)\b/g;

const MAX_LONG_TEXT_CHARS = 4800;
const MAX_SUMMARY_CHARS = 2400;
const MAX_META_CHARS = 200;

function stripUsdPrices(value: string): string {
  return value.replace(USD_PRICE_PATTERN, '').replace(/\s{2,}/g, ' ').trim();
}

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars - 3).trimEnd()}...`;
}

function normalizeVoltage(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const text = String(raw).trim().toLowerCase().replace(/v$/i, '');
  const parsed = Number.parseFloat(text.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeInt(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.trunc(raw);
  const parsed = Number.parseInt(String(raw).replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeString(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const text = stripUsdPrices(String(raw).trim());
  return text.length > 0 ? text : null;
}

function normalizeListField(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (Array.isArray(raw)) {
    const joined = raw
      .map((item) => stripUsdPrices(String(item).trim()))
      .filter(Boolean)
      .join(';');
    return joined.length > 0 ? joined : null;
  }
  const text = stripUsdPrices(String(raw).trim());
  if (!text) return null;
  return text
    .split(/[,;|/]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(';');
}

function normalizeSpecsTable(raw: Record<string, unknown>): Partial<CatalogSpecsTable> {
  return {
    capacity_gb: normalizeInt(raw.capacity_gb) ?? undefined,
    frequency_mhz:
      raw.frequency_mhz === null
        ? null
        : (normalizeInt(raw.frequency_mhz) ?? undefined),
    voltage_v:
      raw.voltage_v === null ? null : (normalizeVoltage(raw.voltage_v) ?? undefined),
    pins: raw.pins === null ? null : (normalizeInt(raw.pins) ?? undefined),
    latency:
      raw.latency === null ? null : (normalizeString(raw.latency) ?? undefined),
    chips: normalizeListField(raw.chips) ?? undefined,
    application: normalizeListField(raw.application) ?? undefined,
    warranty: normalizeString(raw.warranty)?.toLowerCase() ?? undefined,
    packaging: normalizeListField(raw.packaging) ?? undefined,
    certifications: normalizeListField(raw.certifications) ?? undefined,
  };
}

/** Expande bloco YAML v2 (specs_table) para registro plano + metadados derivados do id */
export function expandV2YamlBlock(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const expanded: Record<string, unknown> = { ...raw };
  const specsRaw = raw.specs_table;

  if (specsRaw && typeof specsRaw === 'object') {
    const specs = normalizeSpecsTable(specsRaw as Record<string, unknown>);
    for (const [key, value] of Object.entries(specs)) {
      if (expanded[key] === undefined && value !== undefined) {
        expanded[key] = value;
      }
    }
  }

  const id = normalizeString(raw.id);
  if (id) {
    const derived = deriveMetadataFromId(id);
    if (derived) {
      expanded.brand = expanded.brand ?? derived.brand;
      expanded.line = expanded.line ?? derived.line;
      expanded.format = expanded.format ?? derived.format;
      expanded.type = expanded.type ?? derived.type;
    }
  }

  if (!expanded.description_long && expanded.notes) {
    expanded.description_long = expanded.notes;
  }
  if (!expanded.summary_for_index && expanded.description_short) {
    expanded.summary_for_index = expanded.description_short;
  }

  return expanded;
}

export function normalizeCatalogRecordInput(
  raw: Record<string, unknown>,
): Partial<CatalogRecordInput> {
  const expanded = expandV2YamlBlock(raw);

  const specsPartial = normalizeSpecsTable(
    (expanded.specs_table as Record<string, unknown> | undefined) ??
      expanded,
  );

  const descriptionLong = expanded.description_long
    ? truncateText(stripUsdPrices(String(expanded.description_long)), MAX_LONG_TEXT_CHARS)
    : expanded.notes
      ? truncateText(stripUsdPrices(String(expanded.notes)), MAX_LONG_TEXT_CHARS)
      : undefined;

  const summaryForIndex = expanded.summary_for_index
    ? truncateText(stripUsdPrices(String(expanded.summary_for_index)), MAX_SUMMARY_CHARS)
    : expanded.description_short
      ? truncateText(stripUsdPrices(String(expanded.description_short)), MAX_SUMMARY_CHARS)
      : undefined;

  const metaDescription = expanded.meta_description
    ? truncateText(stripUsdPrices(String(expanded.meta_description)), MAX_META_CHARS)
    : undefined;

  return {
    id: normalizeString(expanded.id) ?? undefined,
    slug: normalizeString(expanded.slug)?.toLowerCase() ?? undefined,
    title: normalizeString(expanded.title) ?? undefined,
    brand: normalizeString(expanded.brand)?.toUpperCase() ?? undefined,
    line: normalizeString(expanded.line)?.toUpperCase() ?? undefined,
    format: normalizeString(expanded.format)?.toUpperCase() ?? undefined,
    type: normalizeString(expanded.type)?.toUpperCase() ?? undefined,
    capacity_gb: specsPartial.capacity_gb,
    frequency_mhz: specsPartial.frequency_mhz,
    voltage_v: specsPartial.voltage_v,
    pins: specsPartial.pins,
    latency: specsPartial.latency,
    chips: specsPartial.chips,
    application: specsPartial.application,
    warranty: specsPartial.warranty,
    packaging: specsPartial.packaging,
    certifications: specsPartial.certifications,
    specs_table:
      specsPartial.capacity_gb != null
        ? (specsPartial as CatalogSpecsTable)
        : undefined,
    description_long: descriptionLong,
    summary_for_index: summaryForIndex,
    meta_description: metaDescription,
    alt_text: normalizeString(expanded.alt_text) ?? undefined,
    source_doc: normalizeString(expanded.source_doc) ?? undefined,
    last_updated: normalizeString(expanded.last_updated) ?? undefined,
    notes: expanded.notes != null ? truncateText(stripUsdPrices(String(expanded.notes))) : undefined,
    description_short:
      expanded.description_short != null
        ? truncateText(stripUsdPrices(String(expanded.description_short)), 600)
        : undefined,
  };
}

/** @deprecated Use normalizeCatalogRecordInput */
export const normalizeRamRecordInput = normalizeCatalogRecordInput;
