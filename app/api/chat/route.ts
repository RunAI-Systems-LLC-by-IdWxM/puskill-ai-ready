import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getTGhosTMinDSystemPrompt } from '@/lib/build-system-prompt';
import { getOpenAIApiKey } from '@/lib/openai-api-key';

export const runtime = 'edge';

const VALID_ROLES = new Set(['user', 'assistant', 'system'] as const);

type ValidRole = 'user' | 'assistant' | 'system';

function hasTextPart(message: UIMessage): boolean {
  return message.parts.some(
    (part) => part.type === 'text' && part.text.trim().length > 0,
  );
}

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

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  try {
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonError('Invalid JSON body', 400);
    }

    if (typeof body !== 'object' || body === null) {
      return jsonError('Invalid request body', 400);
    }

    const { messages } = body as Record<string, unknown>;

    if (!messages || !Array.isArray(messages)) {
      return jsonError('messages must be an array', 400);
    }

    if (messages.length === 0 || messages.length > 50) {
      return jsonError('messages array size is invalid', 400);
    }

    if (!messages.every(isValidUIMessage)) {
      return jsonError('Invalid message format in array', 400);
    }

    const uiMessages = messages as UIMessage[];
    if (!uiMessages.some((message) => message.role === 'user' && hasTextPart(message))) {
      return jsonError('At least one user message with text is required', 400);
    }

    const apiKey = getOpenAIApiKey();

    if (!apiKey) {
      return jsonError('Service unavailable', 503);
    }

    const openai = createOpenAI({ apiKey });

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: getTGhosTMinDSystemPrompt(),
      messages: await convertToModelMessages(uiMessages),
      abortSignal: req.signal,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[api/chat] unhandled error:', error);
    return jsonError('Internal server error', 500);
  }
}
