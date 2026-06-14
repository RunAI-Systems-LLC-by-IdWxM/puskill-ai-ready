/** Linhas oficiais PUSKILL para catálogo de hardware */
export const PUSKILL_CATALOG_LINES = [
  'VENENO',
  'KILLBLADE',
  'FUSE',
  'DIAMOND',
] as const;

export type PuskillCatalogLine = (typeof PUSKILL_CATALOG_LINES)[number];

export const PUSKILL_CATALOG_BRAND = 'PUSKILL' as const;

/** Campos obrigatórios no registro canônico (valor pode ser null quando não aplicável) */
export const CATALOG_REQUIRED_FIELDS = [
  'id',
  'slug',
  'title',
  'brand',
  'line',
  'format',
  'type',
  'capacity_gb',
  'frequency_mhz',
  'voltage_v',
  'pins',
  'latency',
  'chips',
  'application',
  'warranty',
  'packaging',
  'certifications',
  'description_long',
  'summary_for_index',
  'meta_description',
  'alt_text',
  'source_doc',
  'last_updated',
] as const;

export type CatalogRequiredField = (typeof CATALOG_REQUIRED_FIELDS)[number];

export type CatalogSpecsTable = {
  capacity_gb: number;
  frequency_mhz: number | null;
  voltage_v: number | null;
  pins: number | null;
  latency: string | null;
  chips: string;
  application: string;
  warranty: string;
  packaging: string;
  certifications: string;
};

export type CatalogRecordInput = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  line: string;
  format: string;
  type: string;
  capacity_gb: number;
  frequency_mhz: number | null;
  voltage_v: number | null;
  pins: number | null;
  latency: string | null;
  chips: string;
  application: string;
  warranty: string;
  packaging: string;
  certifications: string;
  specs_table: CatalogSpecsTable;
  description_long: string;
  summary_for_index: string;
  meta_description: string;
  alt_text: string;
  source_doc: string;
  last_updated: string;
  /** @deprecated v1 — use description_long */
  notes?: string;
  /** @deprecated v1 — use summary_for_index */
  description_short?: string | null;
};

export type CatalogRecord = CatalogRecordInput & {
  ingest_timestamp: string;
  validation_warnings: string[];
  chunk_text: string;
  embedding_chunks: string[];
};

export type CatalogManifest = {
  generated_at: string;
  source_doc: string;
  total_skus: number;
  /** @deprecated Use total_skus */
  total_records: number;
  count_by_line: Record<string, number>;
  ids: string[];
  ids_with_warnings: Array<{ id: string; validation_warnings: string[] }>;
  duplicate_ids: string[];
  batches_processed: number;
};

export type CatalogBundle = {
  version: 2;
  generated_at: string;
  records: CatalogRecord[];
  manifest: CatalogManifest;
};

/** @deprecated Use PUSKILL_CATALOG_LINES */
export const PUSKILL_RAM_LINES = PUSKILL_CATALOG_LINES;
/** @deprecated Use PuskillCatalogLine */
export type PuskillRamLine = PuskillCatalogLine;
/** @deprecated Use PUSKILL_CATALOG_BRAND */
export const PUSKILL_RAM_BRAND = PUSKILL_CATALOG_BRAND;
/** @deprecated Use CATALOG_REQUIRED_FIELDS */
export const RAM_REQUIRED_FIELDS = CATALOG_REQUIRED_FIELDS;
/** @deprecated Use CatalogRecordInput */
export type RamRecordInput = CatalogRecordInput;
/** @deprecated Use CatalogRecord */
export type RamRecord = CatalogRecord;
/** @deprecated Use CatalogManifest */
export type RamManifest = CatalogManifest;
/** @deprecated Use CatalogBundle */
export type RamCatalog = CatalogBundle;
