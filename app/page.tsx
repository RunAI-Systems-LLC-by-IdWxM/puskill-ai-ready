'use client';

import { useChat } from 'ai/react';
import { useEffect, useState } from 'react';

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

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({ api: '/api/chat' });

  const placeholder = useTypewriterPlaceholder(PLACEHOLDERS);
  const scrollImages = [...HARDWARE_IMAGES, ...HARDWARE_IMAGES];

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
          <h1 className="text-xl font-light tracking-[0.35em] text-white">
            PUSKILL
          </h1>
          <p className="text-sm tracking-wide text-zinc-500">
            AI-Optimized Hardware
          </p>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 pb-8">
          <div className="w-full max-w-2xl rounded-2xl bg-gradient-to-r from-cyan-400 via-orange-500 to-cyan-400 p-[1px] shadow-[0_0_40px_rgba(34,211,238,0.15),0_0_60px_rgba(249,115,22,0.1)]">
            <div className="flex h-[min(70vh,560px)] flex-col rounded-2xl bg-zinc-950/90 backdrop-blur-xl">
              <div className="border-b border-zinc-800/80 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                  <h2 className="text-sm font-medium tracking-widest text-cyan-400">
                    THEDOC
                  </h2>
                  <span className="text-xs text-zinc-600">
                    Inteligência Cognitiva PUSKILL
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                {messages.length === 0 && (
                  <p className="text-sm leading-relaxed text-zinc-500">
                    Bem-vindo à era After AI. Pergunte sobre a linha PUSKILL
                    SYNAPSE, DDR5 e SSDs NVMe Gen5 para ecossistemas de IA.
                  </p>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'text-zinc-300'
                        : 'text-zinc-100'
                    }`}
                  >
                    <span
                      className={
                        message.role === 'user'
                          ? 'text-orange-400'
                          : 'text-cyan-400'
                      }
                    >
                      {message.role === 'user' ? 'Você' : 'TheDoc'}:
                    </span>{' '}
                    {message.content}
                  </div>
                ))}
                {isLoading && (
                  <p className="text-sm text-cyan-400/70 animate-pulse">
                    TheDoc está processando...
                  </p>
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="border-t border-zinc-800/80 px-6 py-4"
              >
                <div className="flex gap-3">
                  <input
                    value={input}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-5 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Enviar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
