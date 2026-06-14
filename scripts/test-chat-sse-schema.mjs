/**
 * Valida chunks SSE do edge-handler contra uiMessageChunkSchema (AI SDK v6).
 */
import { readFileSync } from 'node:fs';
import { parseJsonEventStream } from '@ai-sdk/provider-utils';
import { uiMessageChunkSchema } from 'ai';

const API = process.env.CHAT_API ?? 'http://localhost:3000/api/chat';

async function streamTurn(messages, label) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 't', messages, trigger: 'submit-message' }),
  });

  if (!res.ok) {
    console.log(`${label}: HTTP ${res.status}`, await res.text());
    return null;
  }

  const reader = parseJsonEventStream({
    stream: res.body,
    schema: uiMessageChunkSchema,
  }).getReader();

  const errors = [];
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value.success) {
      errors.push(value.error?.message ?? String(value.error));
      continue;
    }
    chunks.push(value.value.type);
  }

  console.log(`${label}: chunks=[${chunks.join(', ')}]`);
  if (errors.length) {
    console.log(`${label}: SCHEMA ERRORS:`, errors);
  }
  return { chunks, errors };
}

const user1 = { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'oi' }] };
const user2 = { id: 'u2', role: 'user', parts: [{ type: 'text', text: 'fale sobre VENENO' }] };

await streamTurn([user1], 'turn1');
const assistant1 = {
  id: 'a1',
  role: 'assistant',
  parts: [{ type: 'text', text: 'resposta teste', state: 'done' }],
};
await streamTurn([user1, assistant1, user2], 'turn2');
