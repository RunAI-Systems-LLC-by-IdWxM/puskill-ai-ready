'use client';

import {
  motion,
  useScroll,
  useTransform,
  type MotionStyle,
} from 'framer-motion';
import { useRef, type ReactNode } from 'react';

export type ParallaxSectionConfig = {
  id: string;
  label: string;
  /** Tailwind classes or custom class for gradient placeholder backgrounds */
  backgroundClassName?: string;
  /** Optional image URL — replaces gradient when provided */
  imageSrc?: string;
  imageAlt?: string;
  /** Optional video URL — takes precedence over image when provided */
  videoSrc?: string;
  /** Fully custom background node (overrides class/image/video) */
  background?: ReactNode;
};

export const PUSKILL_PARALLAX_SECTIONS: ParallaxSectionConfig[] = [
  {
    id: 'concept-01',
    label: 'PUSKILL CONCEPT 01',
    backgroundClassName:
      'bg-[radial-gradient(ellipse_at_20%_30%,#1a2744_0%,transparent_55%),linear-gradient(160deg,#050505_0%,#111827_45%,#000000_100%)]',
  },
  {
    id: 'concept-02',
    label: 'PUSKILL CONCEPT 02',
    backgroundClassName:
      'bg-[radial-gradient(ellipse_at_80%_20%,#0f172a_0%,transparent_50%),linear-gradient(200deg,#000000_0%,#1e293b_50%,#030712_100%)]',
  },
  {
    id: 'concept-03',
    label: 'PUSKILL CONCEPT 03',
    backgroundClassName:
      'bg-[radial-gradient(circle_at_50%_100%,#172554_0%,transparent_45%),linear-gradient(180deg,#020617_0%,#0b1120_55%,#000000_100%)]',
  },
  {
    id: 'concept-04',
    label: 'PUSKILL CONCEPT 04',
    backgroundClassName:
      'bg-[radial-gradient(ellipse_at_10%_80%,#1f2937_0%,transparent_50%),linear-gradient(145deg,#000000_0%,#18181b_40%,#0c0a09_100%)]',
  },
  {
    id: 'concept-05',
    label: 'PUSKILL CONCEPT 05',
    backgroundClassName:
      'bg-[radial-gradient(ellipse_at_70%_60%,#1e3a5f_0%,transparent_55%),linear-gradient(220deg,#030712_0%,#111827_50%,#000000_100%)]',
  },
];

type ParallaxSectionProps = {
  section: ParallaxSectionConfig;
};

function ParallaxBackground({
  section,
  motionStyle,
}: {
  section: ParallaxSectionConfig;
  motionStyle: MotionStyle;
}) {
  if (section.background) {
    return (
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-[-12%] h-[124%] w-full will-change-transform"
        style={motionStyle}
      >
        {section.background}
      </motion.div>
    );
  }

  if (section.videoSrc) {
    return (
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-[-12%] h-[124%] w-full overflow-hidden will-change-transform"
        style={motionStyle}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
          src={section.videoSrc}
        />
      </motion.div>
    );
  }

  if (section.imageSrc) {
    return (
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-[-12%] h-[124%] w-full overflow-hidden will-change-transform"
        style={motionStyle}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={section.imageSrc}
          alt={section.imageAlt ?? ''}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      aria-hidden
      className={`absolute inset-x-0 top-[-12%] h-[124%] w-full will-change-transform ${section.backgroundClassName ?? 'bg-black'}`}
      style={motionStyle}
    >
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.04%22/%3E%3C/svg%3E')] opacity-60 mix-blend-overlay" />
    </motion.div>
  );
}

function ParallaxSection({ section }: ParallaxSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['-18%', '18%']);
  const labelOpacity = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [0.35, 0.7, 0.7, 0.35]);
  const labelY = useTransform(scrollYProgress, [0, 1], ['12px', '-12px']);

  return (
    <section
      ref={sectionRef}
      id={section.id}
      className="relative h-[100dvh] w-full overflow-hidden"
    >
      <ParallaxBackground section={section} motionStyle={{ y: backgroundY }} />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />

      <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
        <motion.p
          className="max-w-[90%] text-center font-mono text-[0.7rem] tracking-[0.35em] text-white/60 uppercase sm:text-xs"
          style={{ opacity: labelOpacity, y: labelY }}
        >
          {section.label}
        </motion.p>
      </div>
    </section>
  );
}

type PuskillParallaxProps = {
  sections?: ParallaxSectionConfig[];
  className?: string;
};

export function PuskillParallax({
  sections = PUSKILL_PARALLAX_SECTIONS,
  className = '',
}: PuskillParallaxProps) {
  return (
    <div
      className={`w-full overflow-x-hidden ${className}`.trim()}
      data-component="puskill-parallax"
    >
      {sections.map((section) => (
        <ParallaxSection key={section.id} section={section} />
      ))}
    </div>
  );
}

export default PuskillParallax;
