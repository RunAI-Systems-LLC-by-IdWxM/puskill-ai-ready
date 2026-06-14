import Image from 'next/image';
import { BRAND_ASSETS } from '@/lib/brand-config';
import styles from './rill-avatar.module.css';

type RillAvatarProps = {
  size?: number;
  label?: string;
  className?: string;
  pulse?: boolean;
};

export function RillAvatar({
  size = 26,
  label = 'Rill',
  className = '',
  pulse = true,
}: RillAvatarProps) {
  return (
    <div
      className={`relative shrink-0 ${pulse ? styles.pulse : ''} ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <Image
        src={BRAND_ASSETS.RILL_AVATAR}
        alt={label}
        width={size}
        height={size}
        className="h-full w-full object-contain"
        unoptimized
      />
    </div>
  );
}
