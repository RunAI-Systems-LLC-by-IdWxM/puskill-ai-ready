import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { buildTGhosTMinDSystemPrompt } from '@/lib/build-system-prompt';
import { getOpenAIApiKey } from '@/lib/openai-api-key';

export const runtime = 'edge';

const VALID_ROLES = new Set(['user', 'assistant', 'system'] as const);

type ValidRole = 'user' | 'assistant' | 'system';

function isValidUIMessage(message: unknown): message is UIMessage {
  if (typeof message !== 'object' || message === null) return false;

  const { role, parts } = message as Record<string, unknown>;

  return (
    typeof role === 'string' &&
    VALID_ROLES.has(role as ValidRole) &&
    Array.isArray(parts) &&
    parts.length > 0 &&
    parts.length <= 32
  );
}

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (typeof body !== 'object' || body === null) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages } = body as Record<string, unknown>;

  if (!messages || !Array.isArray(messages)) {
    return new Response(
      JSON.stringify({ error: 'messages must be an array' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  if (messages.length === 0 || messages.length > 50) {
    return new Response(
      JSON.stringify({ error: 'messages array size is invalid' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  if (!messages.every(isValidUIMessage)) {
    return new Response(
      JSON.stringify({ error: 'Invalid message format in array' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const apiKey = getOpenAIApiKey();

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Service unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const openai = createOpenAI({ apiKey });

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: buildTGhosTMinDSystemPrompt(),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
