'use client';

import { useChat } from 'ai/react';
import { AssistantMessage } from '@/components/assistant-message';
import { BRAND_FOOTER } from '@/lib/brand-config';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const PLACEHOLDERS = [
  'Peça ao TGhosT...',
  'Inicie a revolução AI Ready...',
  'Linha PUSKILL SYNAPSE...',
];

const FILE_ACCEPT =
  'image/*,video/*,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const HARDWARE_IMAGES = [
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1535372437046-a0216a0cc242?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400&h=300&fit=crop',
];

function useTypewriterPlaceholder(placeholders: string[]) {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = placeholders[index];
    const speed = deleting ? 35 : 70;

    const timeout = setTimeout(() => {
      if (!deleting) {
        if (charIndex < current.length) {
          setText(current.slice(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
        } else {
          setTimeout(() => setDeleting(true), 1800);
        }
      } else if (charIndex > 0) {
        setText(current.slice(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);
      } else {
        setDeleting(false);
        setIndex((prev) => (prev + 1) % placeholders.length);
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, index, placeholders]);

  return text;
}

function IconButton({
  label,
  children,
  disabled,
  onClick,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="3"
        width="6"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M6 11a6 6 0 0 0 12 0M12 17v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
    </svg>
  );
}

export default function Home() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setMessages,
    error,
  } = useChat({ api: '/api/chat' });

  const placeholder = useTypewriterPlaceholder(PLACEHOLDERS);
  const scrollImages = [...HARDWARE_IMAGES, ...HARDWARE_IMAGES];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasInput = input.trim().length > 0;
  const showPromptHeading = messages.length === 0 && !isLoading;

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
  }, [input]);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) return;
    // Upload pipeline — arquivos selecionados via + (imagens, vídeos, PDF)
    event.target.value = '';
  }

  function handleVoiceTalk() {
    // Realtime voice talk — integração futura
  }

  return (
    <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-black">
      <div className="absolute inset-0 overflow-hidden">
        <div className="animate-scroll grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4">
          {scrollImages.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="aspect-[4/3] overflow-hidden rounded-lg opacity-40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 backdrop-blur-lg bg-zinc-950/80" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between px-8 py-6">
          <Link
            href="/"
            aria-label="Ir para home PUSKILL"
            className="inline-flex shrink-0 transition-opacity hover:opacity-80"
            onClick={() => setMessages([])}
          >
            <Image
              src="/assets/branding/logo_puskill_oficial_white.png"
              alt="PUSKILL"
              width={180}
              height={48}
              priority
              className="h-10 w-auto"
            />
          </Link>
          <p className="text-sm tracking-wide text-zinc-500">
            AI-Optimized Hardware
          </p>
        </header>

        <main className="flex min-h-0 flex-1 flex-col items-center px-4 pb-6">
          <div className="flex min-h-0 w-full max-w-3xl flex-1 flex-col">
            <div
              ref={messagesContainerRef}
              className="scrollbar-none min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-2 py-2"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] break-words rounded-3xl px-5 py-3 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-zinc-800/90 text-zinc-100'
                        : 'bg-transparent text-zinc-200'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <AssistantMessage content={message.content} />
                    ) : (
                      <p className="whitespace-pre-line">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-3xl px-2 py-3">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-start">
                  <p className="max-w-[85%] rounded-3xl border border-red-500/30 bg-red-950/40 px-5 py-3 text-sm text-red-200">
                    O motor cognitivo está indisponível no momento. Tente novamente em
                    instantes.
                  </p>
                </div>
              )}

            </div>

            <form onSubmit={handleSubmit} className="mt-auto shrink-0 pt-2">
              {showPromptHeading && (
                <h2 className="mb-8 px-2 text-center font-normal leading-none tracking-tight text-white">
                  <span className="block text-lg italic text-zinc-300 sm:text-xl">
                    ECOSSISTEMA{' '}
                    <span className="relative inline-block text-[1.872em] font-black leading-none">
                      PUSKILL
                      <span className="absolute left-full top-[84%] ml-[0.08em] -translate-y-1/2 text-[0.125em] font-normal leading-none">
                        ®
                      </span>
                    </span>
                  </span>
                  <span className="mt-px block text-xl sm:text-2xl">
                    Qual produto ou operação estruturamos hoje?
                  </span>
                </h2>
              )}

              <div className="flex min-h-[3.85rem] items-center gap-1 rounded-full bg-[#1e1e1e] px-3 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition focus-within:ring-1 focus-within:ring-zinc-600/60 sm:gap-2 sm:px-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={FILE_ACCEPT}
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <IconButton
                  label="Carregar imagens, vídeos ou PDF"
                  disabled={isLoading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PlusIcon />
                </IconButton>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  placeholder={placeholder}
                  rows={1}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (hasInput && !isLoading) {
                        e.currentTarget.form?.requestSubmit();
                      }
                    }
                  }}
                  className="scrollbar-none min-h-[1.925rem] max-h-[8.25rem] min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-2 text-[15px] leading-6 text-zinc-100 placeholder:text-zinc-500 outline-none"
                />

                {isLoading ? (
                  <button
                    type="button"
                    aria-label="Parar geração"
                    onClick={stop}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-300 transition hover:text-white"
                  >
                    <StopIcon />
                  </button>
                ) : (
                  <IconButton
                    label="Conversa por voz em tempo real"
                    onClick={handleVoiceTalk}
                  >
                    <MicIcon />
                  </IconButton>
                )}
              </div>

              <p className="mt-3 text-center text-xs text-zinc-500">
                Powered by{' '}
                <span className="font-semibold text-white">
                  {BRAND_FOOTER.poweredByEntity}
                </span>
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
