'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { AssistantMessage } from '@/components/assistant-message';
import { RillAvatar } from '@/components/rill-avatar';
import { BRAND_FOOTER } from '@/lib/brand-config';
import { getUIMessageText } from '@/lib/get-ui-message-text';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';

const PLACEHOLDERS = [
  'Peça ao Rill...',
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

function useTypewriterPlaceholder(placeholders: string[], enabled: boolean) {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setText('');
      return;
    }

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
  }, [charIndex, deleting, enabled, index, placeholders]);

  return enabled ? text : placeholders[0];
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

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5M12 5l-6 6M12 5l6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  const [input, setInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    messages,
    sendMessage,
    status,
    stop,
    setMessages,
    error,
    clearError,
  } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    onError: (chatError) => {
      console.error('[Rill chat]', chatError);
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || isLoading || submittingRef.current) return;

    submittingRef.current = true;
    clearError();
    void sendMessage({ text })
      .catch((submitError) => {
        console.error('[Rill sendMessage]', submitError);
      })
      .finally(() => {
        submittingRef.current = false;
      });
    setInput('');
  };

  const placeholder = useTypewriterPlaceholder(PLACEHOLDERS, mounted);
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

  useEffect(() => {
    const root = document.getElementById('app-root');
    const viewport = window.visualViewport;
    if (!root || !viewport) return;

    const mobileQuery = window.matchMedia(
      '(max-width: 639px), (orientation: landscape) and (max-height: 500px)',
    );

    const clearViewportLock = () => {
      root.style.width = '';
      root.style.left = '';
      root.style.height = '';
      root.style.top = '';
    };

    const syncViewport = () => {
      root.style.width = `${viewport.width}px`;
      root.style.left = `${viewport.offsetLeft}px`;
      root.style.height = `${viewport.height}px`;
      root.style.top = `${viewport.offsetTop}px`;
    };

    const enableViewportLock = () => {
      syncViewport();
      viewport.addEventListener('resize', syncViewport);
      viewport.addEventListener('scroll', syncViewport);
    };

    const disableViewportLock = () => {
      viewport.removeEventListener('resize', syncViewport);
      viewport.removeEventListener('scroll', syncViewport);
      clearViewportLock();
    };

    const onMobileChange = () => {
      disableViewportLock();
      if (mobileQuery.matches) enableViewportLock();
    };

    if (mobileQuery.matches) enableViewportLock();
    mobileQuery.addEventListener('change', onMobileChange);

    return () => {
      mobileQuery.removeEventListener('change', onMobileChange);
      disableViewportLock();
    };
  }, []);

  useEffect(() => {
    const mobileQuery = window.matchMedia(
      '(max-width: 639px), (orientation: landscape) and (max-height: 500px)',
    );

    let startX = 0;
    let startY = 0;

    const onTouchStart = (event: TouchEvent) => {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      const target = event.target as Node;
      if (messagesContainerRef.current?.contains(target)) return;

      const dx = Math.abs(event.touches[0].clientX - startX);
      const dy = Math.abs(event.touches[0].clientY - startY);
      if (dx > dy) {
        event.preventDefault();
      }
    };

    const enableTouchLock = () => {
      document.addEventListener('touchstart', onTouchStart, { passive: true });
      document.addEventListener('touchmove', onTouchMove, { passive: false });
    };

    const disableTouchLock = () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
    };

    const onMobileChange = () => {
      disableTouchLock();
      if (mobileQuery.matches) enableTouchLock();
    };

    if (mobileQuery.matches) enableTouchLock();
    mobileQuery.addEventListener('change', onMobileChange);

    return () => {
      mobileQuery.removeEventListener('change', onMobileChange);
      disableTouchLock();
    };
  }, []);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) return;
    // Upload pipeline — arquivos selecionados via + (imagens, vídeos, PDF)
    event.target.value = '';
  }

  function handleVoiceTalk() {
    // Realtime voice talk — integração futura
  }

  return (
    <div
      id="app-root"
      className="mobile-root relative flex h-dvh min-h-0 flex-col overflow-hidden bg-black max-sm:fixed max-sm:inset-x-0 max-sm:top-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-full max-sm:max-w-full max-sm:overflow-x-clip"
    >
      <div className="bg-layer absolute inset-0 overflow-hidden max-sm:w-full max-sm:max-w-full max-sm:overflow-x-clip">
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

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col max-sm:w-full max-sm:max-w-full max-sm:overflow-x-clip">
        <header className="flex shrink-0 items-center justify-between px-8 py-6 max-sm:gap-3 max-sm:px-4 max-sm:py-4">
          <Link
            href="/"
            aria-label="Ir para home PUSKILL"
            className="inline-flex shrink-0 transition-opacity hover:opacity-80 max-sm:min-w-0 max-sm:max-w-[52%]"
            onClick={() => setMessages([])}
          >
            <Image
              src="/assets/branding/logo_puskill_oficial_white.png"
              alt="PUSKILL"
              width={180}
              height={48}
              priority
              className="h-10 w-auto max-sm:h-8 max-sm:max-w-full max-sm:object-contain max-sm:object-left"
            />
          </Link>
          <p className="text-sm tracking-wide text-zinc-500 max-sm:shrink-0 max-sm:max-w-[44%] max-sm:text-right max-sm:text-[10px] max-sm:leading-tight landscape:max-sm:text-[9px]">
            AI-Optimized Hardware
          </p>
        </header>

        <main className="flex min-h-0 flex-1 flex-col items-center overflow-x-clip px-4 pb-6 max-sm:w-full max-sm:min-w-0 max-sm:max-w-full">
          <div className="flex min-h-0 w-full max-w-3xl flex-1 flex-col max-sm:min-w-0 max-sm:max-w-full">
            <div
              ref={messagesContainerRef}
              className="scrollbar-none min-h-0 flex-1 touch-pan-y space-y-6 overflow-y-auto overscroll-y-contain px-2 py-2 max-sm:overflow-x-clip"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex w-full min-w-0 ${
                    message.role === 'user'
                      ? 'justify-end'
                      : 'items-start gap-3'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="mt-0.5 shrink-0 overflow-visible">
                      <RillAvatar size={32} />
                    </div>
                  ) : null}
                  <div
                    className={`min-w-0 break-words rounded-3xl px-5 py-3 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'max-w-[85%] bg-zinc-800/90 text-zinc-100'
                        : 'flex-1 text-zinc-200'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <AssistantMessage content={getUIMessageText(message)} />
                    ) : (
                      <p className="whitespace-pre-line">{getUIMessageText(message)}</p>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex w-full min-w-0 items-start gap-3">
                  <div className="mt-0.5 shrink-0 overflow-visible">
                    <RillAvatar size={32} />
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-3xl px-2 py-3">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" />
                  </div>
                </div>
              )}

              {error && status === 'error' && (
                <div className="flex justify-start">
                  <p className="max-w-[85%] rounded-3xl border border-red-500/30 bg-red-950/40 px-5 py-3 text-sm text-red-200">
                    O motor cognitivo está indisponível no momento. Tente novamente em
                    instantes.
                    {process.env.NODE_ENV === 'development' ? (
                      <span className="mt-2 block text-xs text-red-300/90">
                        {error.message}
                      </span>
                    ) : null}
                  </p>
                </div>
              )}

            </div>

            <form onSubmit={handleSubmit} className="mt-auto shrink-0 pt-2">
              {showPromptHeading && (
                <h2 className="prompt-heading mb-8 px-2 text-center font-normal leading-none tracking-tight text-white max-sm:px-3">
                  <span className="block text-lg italic text-zinc-300 max-sm:text-base sm:text-xl">
                    ECOSSISTEMA{' '}
                    <span className="relative inline-block text-[1.872em] font-black leading-none max-sm:text-[1.5em]">
                      PUSKILL
                      <span className="absolute left-full top-[84%] ml-[0.08em] -translate-y-1/2 text-[0.125em] font-normal leading-none">
                        ®
                      </span>
                    </span>
                  </span>
                  <span className="mt-px block text-xl max-sm:text-lg sm:text-2xl">
                    Qual produto ou operação estruturamos hoje?
                  </span>
                </h2>
              )}

              <div className="flex w-full min-w-0 items-center gap-3 max-sm:gap-2">
                <div className="flex min-h-[3.85rem] min-w-0 flex-1 items-center gap-1 rounded-full bg-[#1e1e1e] px-3 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition focus-within:ring-1 focus-within:ring-zinc-600/60 max-sm:gap-1.5 max-sm:px-2.5 sm:gap-2 sm:px-4">
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
                  className="max-sm:h-9 max-sm:w-9"
                >
                  <PlusIcon />
                </IconButton>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={placeholder}
                  rows={1}
                  disabled={isLoading}
                  suppressHydrationWarning
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (hasInput && !isLoading) {
                        e.currentTarget.form?.requestSubmit();
                      }
                    }
                  }}
                  className="scrollbar-none min-h-[1.925rem] max-h-[8.25rem] min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-2 text-[15px] leading-6 text-zinc-100 placeholder:text-zinc-500 outline-none max-sm:max-w-full max-sm:text-[14px]"
                />

                {isLoading ? (
                  <button
                    type="button"
                    aria-label="Parar geração"
                    onClick={stop}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-300 transition hover:text-white max-sm:h-9 max-sm:w-9"
                  >
                    <StopIcon />
                  </button>
                ) : hasInput ? (
                  <button
                    type="submit"
                    aria-label="Enviar mensagem"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-zinc-200 max-sm:h-9 max-sm:w-9"
                  >
                    <SendIcon />
                  </button>
                ) : (
                  <IconButton
                    label="Conversa por voz em tempo real"
                    onClick={handleVoiceTalk}
                    className="max-sm:h-9 max-sm:w-9"
                  >
                    <MicIcon />
                  </IconButton>
                )}
                </div>

                {showPromptHeading ? (
                  <div className="shrink-0 overflow-visible">
                    <RillAvatar size={48} />
                  </div>
                ) : null}
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
