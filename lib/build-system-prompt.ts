import { getBrandLegalSystemContext } from '@/lib/brand-config';
import {
  getHardwareCatalogContext,
  getHardwareCatalogContextCompact,
} from '@/lib/knowledge-base';
import { PUSKILL_MASTER_DOCUMENT } from '@/lib/pmd';
import { getRillPersonaContext } from '@/lib/rill-persona';

const PROMPT_SEPARATOR = '\n\n---\n\n';

/**
 * Assembles Rill system prompt (Edge-safe, no fs).
 * Layers: Persona → PMD (hardware) → Canonical catalog → Core Identity & Brand Legal Hub
 */
export function buildRillSystemPrompt(): string {
  return [
    getRillPersonaContext(),
    PUSKILL_MASTER_DOCUMENT,
    getHardwareCatalogContext(),
    getBrandLegalSystemContext(),
  ].join(PROMPT_SEPARATOR);
}

/** Prompt reduzido para Cloudflare Workers (sem listagem completa de SKUs) */
export function buildRillEdgeSystemPrompt(): string {
  return [
    getRillPersonaContext(),
    PUSKILL_MASTER_DOCUMENT,
    getHardwareCatalogContextCompact(),
    getBrandLegalSystemContext(),
  ].join(PROMPT_SEPARATOR);
}

let cachedSystemPrompt: string | undefined;
let cachedEdgeSystemPrompt: string | undefined;

/** Prompt cacheado para evitar recomputação a cada request no Edge */
export function getRillSystemPrompt(): string {
  if (!cachedSystemPrompt) {
    cachedSystemPrompt = buildRillSystemPrompt();
  }
  return cachedSystemPrompt;
}

export function getRillEdgeSystemPrompt(): string {
  if (!cachedEdgeSystemPrompt) {
    cachedEdgeSystemPrompt = buildRillEdgeSystemPrompt();
  }
  return cachedEdgeSystemPrompt;
}
