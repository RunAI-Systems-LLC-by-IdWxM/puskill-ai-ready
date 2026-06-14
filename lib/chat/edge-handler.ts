import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import type { UIMessage } from 'ai';

type ChatRole = 'user' | 'assistant' | 'system';

const VALID_ROLES = new Set<ChatRole>(['user', 'assistant', 'system']);

function jsonError(message: string, status: number, code?: string): Response {
  return Response.json({ error: message, code }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUIMessageLike(raw: unknown): raw is UIMessage {
  if (!isRecord(raw)) return false;
  if (typeof raw.role !== 'string' || !VALID_ROLES.has(raw.role as ChatRole)) {
    return false;
  }
  if (!Array.isArray(raw.parts)) return false;
  return raw.parts.every(
    (part) =>
      isRecord(part) &&
      typeof part.type === 'string' &&
      (part.type !== 'text' || typeof part.text === 'string'),
  );
}

function hasUserText(messages: UIMessage[]): boolean {
  return messages.some(
    (message) =>
      message.role === 'user' &&
      message.parts.some(
        (part) => part.type === 'text' && part.text.trim().length > 0,
      ),
  );
}

async function toModelMessages(messages: UIMessage[]) {
  const { convertToModelMessages } = await import('ai');
  return convertToModelMessages(messages);
}

async function* parseOpenAIStream(
  body: ReadableStream<Uint8Array> | null,
): AsyncGenerator<string> {
  if (!body) return;
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

export async function handleEdgeChatPost(req: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400, 'invalid_json');
  }

  if (!isRecord(body)) {
    return jsonError('Invalid request body', 400, 'invalid_body');
  }

  const rawMessages = body.messages;

  if (!rawMessages || !Array.isArray(rawMessages)) {
    return jsonError('messages must be an array', 400, 'messages_not_array');
  }

  if (rawMessages.length === 0 || rawMessages.length > 50) {
    return jsonError('messages array size is invalid', 400, 'messages_size_invalid');
  }

  if (!rawMessages.every(isUIMessageLike)) {
    console.error(
      '[api/chat] invalid message shape',
      JSON.stringify(
        rawMessages.map((m) =>
          isRecord(m)
            ? {
                role: m.role,
                partTypes: Array.isArray(m.parts)
                  ? m.parts.map((p) => (isRecord(p) ? p.type : '?'))
                  : 'no-parts',
              }
            : m,
        ),
      ),
    );
    return jsonError('Invalid message format in array', 400, 'invalid_message_format');
  }

  const messages = rawMessages as UIMessage[];

  if (!hasUserText(messages)) {
    return jsonError(
      'At least one user message with text is required',
      400,
      'missing_user_text',
    );
  }

  const { getOpenAIApiKey } = await import('@/lib/openai-api-key');
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return jsonError('Service unavailable', 503, 'missing_api_key');
  }

  const { getRillEdgeSystemPrompt } = await import('@/lib/build-system-prompt');
  const system = getRillEdgeSystemPrompt();
  const modelMessages = await toModelMessages(messages);

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          stream: true,
          messages: [{ role: 'system', content: system }, ...modelMessages],
        }),
        signal: req.signal,
      });

      if (!upstream.ok) {
        const detail = await upstream.text();
        console.error('[api/chat] OpenAI upstream error:', upstream.status, detail);
        writer.write({
          type: 'error',
          errorText: 'Upstream model error',
        });
        return;
      }

      const textPartId = `text_${crypto.randomUUID().replace(/-/g, '')}`;
      writer.write({ type: 'start-step' });
      writer.write({ type: 'text-start', id: textPartId });

      for await (const delta of parseOpenAIStream(upstream.body)) {
        writer.write({ type: 'text-delta', id: textPartId, delta });
      }

      writer.write({ type: 'text-end', id: textPartId });
      writer.write({ type: 'finish-step' });
      writer.write({ type: 'finish', finishReason: 'stop' });
    },
    onError: (error) => {
      console.error('[api/chat] stream error:', error);
      return 'Stream processing failed';
    },
  });

  return createUIMessageStreamResponse({ stream });
}
