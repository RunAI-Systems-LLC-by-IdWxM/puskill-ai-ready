/**
 * Simula 2 turnos do useChat contra /api/chat para reproduzir erro multi-turn.
 * Uso: node scripts/test-chat-multiturn.mjs
 */
const API = process.env.CHAT_API ?? 'http://localhost:3000/api/chat';

async function postChat(messages) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'test-chat-id',
      messages,
      trigger: 'submit-message',
      messageId: messages.at(-1)?.id,
    }),
  });

  const text = await res.text();
  return { status: res.status, text: text.slice(0, 500) };
}

function buildAssistantFromStream(sseText) {
  let assistantText = '';
  for (const line of sseText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') continue;
    try {
      const chunk = JSON.parse(data);
      if (chunk.type === 'text-delta' && chunk.delta) {
        assistantText += chunk.delta;
      }
    } catch {
      // ignore
    }
  }

  return {
    id: 'assistant-1',
    role: 'assistant',
    parts: [
      { type: 'text', text: assistantText, state: 'done' },
    ],
  };
}

const user1 = {
  id: 'user-1',
  role: 'user',
  parts: [{ type: 'text', text: 'oi' }],
};

console.log('Turno 1...');
const turn1 = await postChat([user1]);
console.log('Status:', turn1.status);
if (turn1.status !== 200) {
  console.error(turn1.text);
  process.exit(1);
}

const assistant1Plain = buildAssistantFromStream(turn1.text);
console.log('Assistant 1:', assistant1Plain.parts[0].text.slice(0, 80) + '...');

const user2 = {
  id: 'user-2',
  role: 'user',
  parts: [{ type: 'text', text: 'qual linha PUSKILL para DDR4?' }],
};

// Cenário A: assistant só com text (handler novo)
console.log('\nTurno 2 (text only)...');
const turn2a = await postChat([user1, assistant1Plain, user2]);
console.log('Status:', turn2a.status, turn2a.status === 200 ? 'OK' : turn2a.text);

// Cenário B: assistant com step-start (handler antigo / sessão persistida)
const assistant1Legacy = {
  id: 'assistant-1',
  role: 'assistant',
  parts: [
    { type: 'step-start' },
    { type: 'text', text: assistant1Plain.parts[0].text, state: 'done' },
  ],
};

console.log('\nTurno 2 (step-start + text)...');
const turn2b = await postChat([user1, assistant1Legacy, user2]);
console.log('Status:', turn2b.status, turn2b.status === 200 ? 'OK' : turn2b.text);

// Cenário C: assistant só step-start (stream incompleto)
const assistant1Broken = {
  id: 'assistant-1',
  role: 'assistant',
  parts: [{ type: 'step-start' }],
};

console.log('\nTurno 2 (only step-start)...');
const turn2c = await postChat([user1, assistant1Broken, user2]);
console.log('Status:', turn2c.status, turn2c.status === 200 ? 'OK' : turn2c.text);

// Cenário D: mensagens vazias (sendMessage null)
console.log('\nTurno 2 (messages vazio)...');
const turn2d = await postChat([]);
console.log('Status:', turn2d.status, turn2d.text);
