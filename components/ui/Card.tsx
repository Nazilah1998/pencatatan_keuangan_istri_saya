'use client';
import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  hover?: boolean;
  style?: React.CSSProperties;
}

export const Card = React.memo(function Card({
  children,
  className,
  padding = 'md',
  hover = false,
  style,
}: CardProps) {
  const paddingMap = { none: '0', sm: '1rem', md: '1.5rem', lg: '2rem' };

  return (
    <div
      className={cn('card', hover && 'card-hover', className)}
      style={{ padding: paddingMap[padding], ...style }}
    >
      {children}
    </div>
  );
});
