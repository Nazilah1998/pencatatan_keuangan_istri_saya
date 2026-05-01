'use client';
import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = 20, borderRadius, className }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className || ''}`}
      style={{ width, height, borderRadius: borderRadius || 'var(--radius-md)' }}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Skeleton width="40%" height={14} />
      <Skeleton width="70%" height={32} />
      <Skeleton width="50%" height={12} />
    </div>
  );
}

export function TransactionRowSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 0', borderBottom: '1px solid var(--color-divider)' }}>
      <Skeleton width={40} height={40} borderRadius="50%" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} />
      </div>
      <Skeleton width={80} height={18} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <TransactionRowSkeleton key={i} />
      ))}
    </div>
  );
}
