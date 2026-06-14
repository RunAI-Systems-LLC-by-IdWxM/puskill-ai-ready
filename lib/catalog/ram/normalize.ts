import type { RamRecordInput } from '@/lib/catalog/ram/types';

const USD_PRICE_PATTERN =
  /\$\s*\d+(?:[.,]\d+)?|\bUSD\s*\d+(?:[.,]\d+)?|\b\d+(?:[.,]\d+)?\s*(?:USD|usd|dólares?)\b/g;

const MAX_FREE_TEXT_CHARS = 2400;

function stripUsdPrices(value: string): string {
  return value.replace(USD_PRICE_PATTERN, '').replace(/\s{2,}/g, ' ').trim();
}

function truncateText(value: string, maxChars = MAX_FREE_TEXT_CHARS): string {
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

export function normalizeRamRecordInput(
  raw: Record<string, unknown>,
): Partial<RamRecordInput> {
  return {
    id: normalizeString(raw.id) ?? undefined,
    brand: normalizeString(raw.brand)?.toUpperCase() ?? undefined,
    line: normalizeString(raw.line)?.toUpperCase() ?? undefined,
    format: normalizeString(raw.format)?.toUpperCase() ?? undefined,
    type: normalizeString(raw.type)?.toUpperCase() ?? undefined,
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
    notes: raw.notes != null ? truncateText(stripUsdPrices(String(raw.notes))) : undefined,
    source_doc: normalizeString(raw.source_doc) ?? undefined,
    description_short:
      raw.description_short != null
        ? truncateText(stripUsdPrices(String(raw.description_short)), 600)
        : undefined,
  };
}
