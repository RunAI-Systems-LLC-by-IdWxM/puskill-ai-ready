import { PUSKILL_CATALOG_BRAND, PUSKILL_CATALOG_LINES } from '@/lib/catalog/ram/types';

const LINE_SET = new Set<string>(PUSKILL_CATALOG_LINES);

export type DerivedIdMetadata = {
  brand: string;
  line: string;
  format: string;
  type: string;
};

function inferTypeFromId(parts: string[]): string {
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

function inferFormatFromId(parts: string[], type: string): string {
  if (parts.includes('SODIMM')) return 'SODIMM';
  if (parts.includes('UDIMM')) return 'UDIMM';
  if (type.startsWith('SSD-SATA') || parts.includes('SATA')) return 'SATA-2.5';
  if (parts.includes('M2') || parts.includes('NVME')) {
    return parts.includes('128GB') ? 'M.2-2242' : 'M.2-2280';
  }
  if (parts.includes('DIMM') || type.startsWith('DDR')) return 'DIMM';
  return parts[3] ?? 'UNKNOWN';
}

export function deriveMetadataFromId(id: string): DerivedIdMetadata | null {
  const parts = id.toUpperCase().split('-');
  if (parts.length < 3 || parts[0] !== 'PUSKILL') return null;

  const line = parts[1];
  if (!LINE_SET.has(line)) return null;

  const type = inferTypeFromId(parts);
  const format = inferFormatFromId(parts, type);

  return {
    brand: PUSKILL_CATALOG_BRAND,
    line,
    format,
    type,
  };
}
