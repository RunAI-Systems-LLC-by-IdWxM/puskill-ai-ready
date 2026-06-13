'use client';

import { useChat } from 'ai/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const PLACEHOLDERS = [
  'Inicie a revolução AI Ready...',
  'Linha PUSKILL SYNAPSE...',
];

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
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-800/80 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
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

function ToolsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 3h6l1 4h4v6h-4l-1 4H9l-1-4H4V7h4l1-4z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <path
        d="M6 17l4.5-4.5a1 1 0 0 1 1.4 0L16 17"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 12l2-2a1 1 0 0 1 1.4 0L20 14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5M12 5l-5 5M12 5l5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setMessages } =
    useChat({ api: '/api/chat' });

  const placeholder = useTypewriterPlaceholder(PLACEHOLDERS);
  const scrollImages = [...HARDWARE_IMAGES, ...HARDWARE_IMAGES];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInput = input.trim().length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [input]);

  return (
    <div className="relative h-screen overflow-hidden bg-black">
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

      <div className="relative z-10 flex h-full flex-col">
        <header className="flex items-center justify-between px-8 py-6">
          <Link
            href="/"
            aria-label="Ir para home PUSKILL"
            className="inline-flex shrink-0 transition-opacity hover:opacity-80"
            onClick={() => setMessages([])}
          >
            <Image
              src="/logo_puskill_oficial_white.png"
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

        <main className="flex flex-1 flex-col items-center px-4 pb-6">
          <div className="flex h-full w-full max-w-3xl flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto px-2 py-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-3xl px-5 py-3 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-zinc-800/90 text-zinc-100'
                        : 'bg-transparent text-zinc-200'
                    }`}
                  >
                    {message.content}
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

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="mt-auto pt-2">
              <div className="overflow-hidden rounded-[2rem] border border-zinc-600/80 bg-[#1e1f20] px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md transition focus-within:border-zinc-500">
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
                  className="max-h-40 w-full resize-none bg-transparent px-1 py-1 text-[15px] leading-6 text-zinc-100 placeholder:text-zinc-500 outline-none"
                />

                <div className="mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    <IconButton label="Adicionar">
                      <PlusIcon />
                    </IconButton>
                    <IconButton label="Ferramentas">
                      <ToolsIcon />
                    </IconButton>
                    <IconButton label="Enviar imagem">
                      <ImageIcon />
                    </IconButton>
                  </div>

                  <div className="flex items-center gap-1">
                    <IconButton label="Entrada por voz" disabled={isLoading}>
                      <MicIcon />
                    </IconButton>

                    {isLoading ? (
                      <button
                        type="button"
                        aria-label="Parar geração"
                        onClick={stop}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-zinc-200 transition hover:bg-zinc-600"
                      >
                        <StopIcon />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        aria-label="Enviar mensagem"
                        disabled={!hasInput}
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                          hasInput
                            ? 'bg-zinc-100 text-zinc-900 hover:bg-white'
                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}
                      >
                        <SendIcon />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-3 text-center text-xs text-zinc-500">
                Powered by{' '}
                <span className="font-semibold text-white">RunAI Systems LLC</span>
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
