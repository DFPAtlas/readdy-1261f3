'use client';

import { useEffect, useState } from 'react';
import { getAvatarUrl } from '@/lib/profile';

interface Props {
  path: string | null;
  name: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProfileAvatar({ path, name, size = 'md' }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAvatarUrl(path).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [path]);

  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClasses =
    size === 'sm'
      ? 'w-8 h-8 text-xs'
      : size === 'lg'
        ? 'w-20 h-20 text-2xl'
        : 'w-10 h-10 text-sm';

  if (url) {
    return <img src={url} alt={name || ''} className={`${sizeClasses} rounded-full object-cover`} />;
  }

  return (
    <div className={`${sizeClasses} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold`}>
      {initials}
    </div>
  );
}