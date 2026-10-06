import type { ReactNode } from 'react'

export function AuthCard({
  title,
  subtitle,
  footer,
  children,
}: {
  title: ReactNode
  subtitle?: ReactNode
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="relative w-full rounded-[2rem] p-1.5 sm:p-2 bg-gradient-to-b from-[var(--line-subtle)] via-[var(--surface-overlay)]/40 to-[var(--line-subtle)]/40 shadow-[var(--shadow-pop)] border border-[var(--line-subtle)]/60 backdrop-blur-xl">
      <section className="rounded-[calc(2rem-0.375rem)] bg-[var(--surface-raised)] border border-[var(--line-subtle)]/60 p-6 sm:p-8 shadow-sm">
        <header className="mb-7 text-center">
          <h1 className="font-display text-2xl sm:text-[1.65rem] font-bold tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-[var(--text-muted)] leading-relaxed">
              {subtitle}
            </p>
          )}
        </header>

        {children}

        {footer && (
          <div className="mt-6 border-t border-[var(--line-subtle)] pt-5">
            {footer}
          </div>
        )}
      </section>
    </div>
  )
}