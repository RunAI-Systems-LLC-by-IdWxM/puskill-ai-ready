/**
 * Normaliza e segmenta texto da IA para exibição no chat.
 * Permite imagens Markdown apenas para assets do catálogo.
 */

export const RESPONSE_FOOTER_MARKER = 'Powered by RunAI Systems LLC';

const CATALOG_IMAGE_MARKDOWN_REGEX = /!\[([^\]]*)\]\((\/assets\/branding\/[^)]+)\)/g;

export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'image'; alt: string; src: string };

/** Remove Markdown decorativo — preserva ![alt](/assets/branding/...) */
export function stripMarkdownSyntax(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/\[cite:\s*\d+(?:,\s*\d+)?\]/gi, '')
    .trim();
}

/** Colapsa quebras excessivas mantendo parágrafos distintos */
export function normalizeLineBreaks(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

/** Garante linha em branco antes do rodapé corporativo na resposta da IA */
export function ensureResponseFooterSpacing(text: string): string {
  const markerIndex = text.indexOf(RESPONSE_FOOTER_MARKER);
  if (markerIndex === -1) return text;

  const body = text.slice(0, markerIndex).replace(/\n+$/, '');
  const footer = text.slice(markerIndex).trim();

  return body ? `${body}\n\n${footer}` : footer;
}

export function formatAssistantMessage(content: string): string {
  return ensureResponseFooterSpacing(
    normalizeLineBreaks(stripMarkdownSyntax(content)),
  );
}

export type ParsedAssistantMessage = {
  body: string;
  footer: string | null;
};

/** Separa conteúdo da resposta e rodapé corporativo para renderização */
export function parseAssistantMessage(content: string): ParsedAssistantMessage {
  const text = formatAssistantMessage(content);
  const markerIndex = text.indexOf(RESPONSE_FOOTER_MARKER);

  if (markerIndex === -1) {
    return { body: text, footer: null };
  }

  return {
    body: text.slice(0, markerIndex).trimEnd(),
    footer: text.slice(markerIndex).trim(),
  };
}

/** Divide bloco de texto em segmentos de texto e imagens do catálogo */
export function parseMessageSegments(block: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;

  for (const match of block.matchAll(CATALOG_IMAGE_MARKDOWN_REGEX)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      const text = block.slice(lastIndex, index).trimEnd();
      if (text) segments.push({ type: 'text', content: text });
    }

    segments.push({
      type: 'image',
      alt: match[1],
      src: match[2],
    });

    lastIndex = index + match[0].length;
  }

  if (lastIndex < block.length) {
    const text = block.slice(lastIndex).trimStart();
    if (text) segments.push({ type: 'text', content: text });
  }

  if (segments.length === 0 && block.trim()) {
    segments.push({ type: 'text', content: block });
  }

  return segments;
}
