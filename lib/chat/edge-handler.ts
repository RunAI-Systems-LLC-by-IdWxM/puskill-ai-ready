type ChatRole = 'user' | 'assistant' | 'system';

type TextPart = { type: 'text'; text: string };

export type EdgeUIMessage = {
  id?: string;
  role: ChatRole;
  parts: TextPart[];
};

const VALID_ROLES = new Set<ChatRole>(['user', 'assistant', 'system']);

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

function isEdgeUIMessage(message: unknown): message is EdgeUIMessage {
  if (typeof message !== 'object' || message === null) return false;
  const { role, parts } = message as Record<string, unknown>;
  if (typeof role !== 'string' || !VALID_ROLES.has(role as ChatRole)) return false;
  if (!Array.isArray(parts) || parts.length === 0 || parts.length > 32) return false;
  return parts.every(
    (part) =>
      typeof part === 'object' &&
      part !== null &&
      (part as TextPart).type === 'text' &&
      typeof (part as TextPart).text === 'string',
  );
}

function hasUserText(messages: EdgeUIMessage[]): boolean {
  return messages.some(
    (message) =>
      message.role === 'user' &&
      message.parts.some((part) => part.type === 'text' && part.text.trim().length > 0),
  );
}

function toOpenAIMessages(messages: EdgeUIMessage[]) {
  return messages
    .map((message) => ({
      role: message.role,
      content: message.parts
        .filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join(''),
    }))
    .filter((message) => message.content.trim().length > 0);
}

function createUiMessageStreamResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

function encodeSseEvent(payload: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
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

  if (!messages.every(isEdgeUIMessage)) {
    return jsonError('Invalid message format in array', 400);
  }

  const uiMessages = messages as EdgeUIMessage[];
  if (!hasUserText(uiMessages)) {
    return jsonError('At least one user message with text is required', 400);
  }

  const { getOpenAIApiKey } = await import('@/lib/openai-api-key');
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return jsonError('Service unavailable', 503);
  }

  const { getTGhosTMinDEdgeSystemPrompt } = await import('@/lib/build-system-prompt');
  const system = getTGhosTMinDEdgeSystemPrompt();

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        { role: 'system', content: system },
        ...toOpenAIMessages(uiMessages),
      ],
    }),
    signal: req.signal,
  });

  if (!upstream.ok) {
    const detail = await upstream.text();
    console.error('[api/chat] OpenAI upstream error:', upstream.status, detail);
    return jsonError('Upstream model error', 502);
  }

  const messageId = `msg_${crypto.randomUUID().replace(/-/g, '')}`;
  const openAIStream = parseOpenAIStream(upstream.body);

  const sseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(encodeSseEvent({ type: 'start' }));
        controller.enqueue(encodeSseEvent({ type: 'start-step' }));
        controller.enqueue(encodeSseEvent({ type: 'text-start', id: messageId }));

        for await (const delta of openAIStream) {
          controller.enqueue(
            encodeSseEvent({ type: 'text-delta', id: messageId, delta }),
          );
        }

        controller.enqueue(encodeSseEvent({ type: 'text-end', id: messageId }));
        controller.enqueue(encodeSseEvent({ type: 'finish-step' }));
        controller.enqueue(encodeSseEvent({ type: 'finish', finishReason: 'stop' }));
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('[api/chat] stream transform error:', error);
        controller.error(error);
      }
    },
  });

  return createUiMessageStreamResponse(sseStream);
}
