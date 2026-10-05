import type { ReactNode } from 'react'

import { cn } from './Button'

type Props = {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
  children: ReactNode
}

export function Card({ title, subtitle, action, className, children }: Props) {
  return (
    <section className={cn('card p-4 sm:p-5', className)}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="truncate text-base font-semibold">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-[var(--text-muted)]">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

type StatProps = {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  tone?: 'neutral' | 'positive' | 'negative'
  icon?: ReactNode
}

const TONES = {
  neutral: 'text-[var(--text-primary)]',
  positive: 'text-[var(--accent)]',
  negative: 'text-[var(--negative)]',
} as const

export function StatTile({ label, value, hint, tone = 'neutral', icon }: StatProps) {
  return (
    <div className="tile p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
        {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
      </div>
      <p className={cn('tnum mt-2 text-xl font-semibold', TONES[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  )
}

export function EmptyState({ title, hint, action }: { title: ReactNode; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius-tile)] border border-dashed border-[var(--line-subtle)] px-6 py-10 text-center">
      <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
      {hint && <p className="max-w-sm text-xs text-[var(--text-muted)]">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-[var(--radius-tile)]', className)} aria-hidden />
}