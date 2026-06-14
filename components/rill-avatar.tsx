'use client';

import Image from 'next/image';
import { BRAND_ASSETS } from '@/lib/brand-config';
import styles from './rill-avatar.module.css';

type RillAvatarProps = {
  size?: number;
  label?: string;
  className?: string;
  animated?: boolean;
};

export function RillAvatar({
  size = 26,
  label = 'Rill',
  className,
  animated = true,
}: RillAvatarProps) {
  const animationClass = animated ? styles.animated : '';

  return (
    <span
      className={`${styles.avatar} ${animationClass} ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={BRAND_ASSETS.RILL_AVATAR}
        alt={label}
        width={size}
        height={size}
        className={styles.image}
        unoptimized
      />
    </span>
  );
}
