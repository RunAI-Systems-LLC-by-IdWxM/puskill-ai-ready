import { getBrandLegalSystemContext } from '@/lib/brand-config';
import { PUSKILL_MASTER_DOCUMENT } from '@/lib/pmd';
import { getTGhosTMinDPersonaContext } from '@/lib/tghostmind-persona';

const PROMPT_SEPARATOR = '\n\n---\n\n';

/**
 * Assembles TGhosTMinD system prompt (Edge-safe, no fs).
 * Layers: Persona → PMD (hardware) → Core Identity & Brand Legal Hub
 */
export function buildTGhosTMinDSystemPrompt(): string {
  return [
    getTGhosTMinDPersonaContext(),
    PUSKILL_MASTER_DOCUMENT,
    getBrandLegalSystemContext(),
  ].join(PROMPT_SEPARATOR);
}

export const TGhosTMinD_SYSTEM_PROMPT = buildTGhosTMinDSystemPrompt();
