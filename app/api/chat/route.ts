import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { BRAND_KNOWLEDGE } from '@/lib/knowledge-base';

export const runtime = 'edge';

const VALID_ROLES = new Set(['user', 'assistant', 'system'] as const);

type ValidRole = 'user' | 'assistant' | 'system';

type ValidMessage = {
  role: ValidRole;
  content: string;
};

function isValidMessage(message: unknown): message is ValidMessage {
  if (typeof message !== 'object' || message === null) return false;

  const { role, content } = message as Record<string, unknown>;

  return (
    typeof role === 'string' &&
    VALID_ROLES.has(role as ValidRole) &&
    typeof content === 'string' &&
    content.length > 0 &&
    content.length <= 4000
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

  if (!messages.every(isValidMessage)) {
    return new Response(
      JSON.stringify({ error: 'Invalid message format in array' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: BRAND_KNOWLEDGE,
    messages,
  });

  return result.toDataStreamResponse();
}
