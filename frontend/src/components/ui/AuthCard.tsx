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
    <section className="card w-full p-5 sm:p-6">
      <header className="mb-6 text-center">
        <h1 className="font-display text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>}
      </header>

      {children}

      {footer && <div className="mt-6 border-t border-[var(--line-subtle)] pt-5">{footer}</div>}
    </section>
  )
}