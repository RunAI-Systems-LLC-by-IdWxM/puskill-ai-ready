import { getBrandLegalSystemContext } from '@/lib/brand-config';
import { getHardwareCatalogContext } from '@/lib/knowledge-base';
import { PUSKILL_MASTER_DOCUMENT } from '@/lib/pmd';
import { getTGhosTMinDPersonaContext } from '@/lib/tghostmind-persona';

const PROMPT_SEPARATOR = '\n\n---\n\n';

/**
 * Assembles TGhosTMinD system prompt (Edge-safe, no fs).
 * Layers: Persona → PMD (hardware) → Canonical catalog → Core Identity & Brand Legal Hub
 */
export function buildTGhosTMinDSystemPrompt(): string {
  return [
    getTGhosTMinDPersonaContext(),
    PUSKILL_MASTER_DOCUMENT,
    getHardwareCatalogContext(),
    getBrandLegalSystemContext(),
  ].join(PROMPT_SEPARATOR);
}

let cachedSystemPrompt: string | undefined;

/** Prompt cacheado para evitar recomputação a cada request no Edge */
export function getTGhosTMinDSystemPrompt(): string {
  if (!cachedSystemPrompt) {
    cachedSystemPrompt = buildTGhosTMinDSystemPrompt();
  }
  return cachedSystemPrompt;
}
