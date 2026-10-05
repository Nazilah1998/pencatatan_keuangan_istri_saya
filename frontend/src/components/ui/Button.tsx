import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--text-inverted)] hover:brightness-110 active:brightness-95 shadow-[var(--shadow-tile)]',
  secondary:
    'bg-[var(--surface-overlay)] text-[var(--text-primary)] border border-[var(--line-subtle)] hover:border-[var(--line-strong)]',
  ghost: 'text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-primary)]',
  danger: 'bg-[var(--negative-soft)] text-[var(--negative)] hover:bg-[var(--negative)] hover:text-[var(--text-inverted)]',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-[0.625rem] gap-1.5',
  md: 'h-11 px-4 text-sm rounded-[0.75rem] gap-2',
  lg: 'h-13 px-6 text-base rounded-[0.875rem] gap-2',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  block?: boolean
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-[background-color,border-color,filter,opacity] duration-150',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  )
}