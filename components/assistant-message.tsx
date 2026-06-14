import Image from 'next/image';
import { BRAND_FOOTER } from '@/lib/brand-config';
import {
  parseAssistantMessage,
  parseMessageSegments,
} from '@/lib/format-assistant-message';

type AssistantMessageProps = {
  content: string;
};

function MessageBlock({ block }: { block: string }) {
  const segments = parseMessageSegments(block);

  return (
    <div className="space-y-3">
      {segments.map((segment, index) => {
        if (segment.type === 'image') {
          return (
            <div
              key={`img-${index}`}
              className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900/80 sm:max-w-[28.75rem]"
            >
              <Image
                src={segment.src}
                alt={segment.alt || 'Produto PUSKILL'}
                fill
                sizes="(max-width: 768px) 85vw, 560px"
                className="object-contain p-8 sm:p-10"
                unoptimized
              />
            </div>
          );
        }

        return (
          <p key={`text-${index}`} className="whitespace-pre-line break-words">
            {segment.content}
          </p>
        );
      })}
    </div>
  );
}

export function AssistantMessage({ content }: AssistantMessageProps) {
  const { body, footer } = parseAssistantMessage(content);
  const blocks = body.split(/\n\n+/).filter(Boolean);

  return (
    <div className="min-w-0 break-words">
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <MessageBlock key={index} block={block} />
        ))}
      </div>

      {footer ? (
        <div className="mt-6">
          <div className="mb-4 h-4" aria-hidden />
          <div className="text-center text-[10px] leading-relaxed text-zinc-400 sm:text-[11px]">
            <p>{BRAND_FOOTER.poweredByLine}</p>
            <p className="italic">{BRAND_FOOTER.designedByLine}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
