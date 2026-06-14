import type { UIMessage } from 'ai';

export function getUIMessageText(message: UIMessage): string {
  return message.parts
    .filter(
      (part): part is Extract<typeof part, { type: 'text' }> =>
        part.type === 'text',
    )
    .map((part) => part.text)
    .join('');
}
