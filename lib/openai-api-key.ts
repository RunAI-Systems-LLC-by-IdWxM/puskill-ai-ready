/**
 * Resolve OpenAI API key across local and Vercel-compatible env names.
 * Vercel keys allow only letters, numbers, and underscores — not hyphens.
 */
const API_KEY_ENV_NAMES = [
  'OPENAI_API_KEY',
  'PUSKILL_AI_READY_API_KEY',
  'puskill-ai-ready_API_KEY',
] as const;

export function getOpenAIApiKey(): string | undefined {
  for (const name of API_KEY_ENV_NAMES) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

export const OPENAI_API_KEY_ENV_HINT =
  'Configure OPENAI_API_KEY (recomendado) ou PUSKILL_AI_READY_API_KEY no painel de deploy.';
