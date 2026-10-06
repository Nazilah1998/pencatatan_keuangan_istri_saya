import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

import { cn } from './Button'

const FIELD =
  'w-full h-11 sm:h-12 rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)] px-3.5 py-2 text-base sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none disabled:opacity-50'

const LABEL = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]'

function FieldShell({
  label,
  hint,
  error,
  children,
  id,
}: {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  children: ReactNode
  id: string
}) {
  return (
    <div>
      {label && (
        <label className={LABEL} htmlFor={id}>
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-[var(--negative)]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  )
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  rightSlot?: ReactNode
}

export function Input({ label, hint, error, rightSlot, className, ...rest }: InputProps) {
  const id = useId()
  return (
    <FieldShell label={label} hint={hint} error={error} id={id}>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          className={cn(FIELD, 'tnum', rightSlot ? 'pr-11' : '', className)}
          {...rest}
        />
        {rightSlot && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightSlot}
          </div>
        )}
      </div>
    </FieldShell>
  )
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

export function Select({ label, hint, error, className, children, ...rest }: SelectProps) {
  const id = useId()
  return (
    <FieldShell label={label} hint={hint} error={error} id={id}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD, 'appearance-none pr-8', className)}
        style={{
          backgroundImage:
            'linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)',
          backgroundPosition: 'right 1rem top 55%, right 0.7rem top 55%',
          backgroundSize: '0.3rem 0.3rem, 0.3rem 0.3rem',
          backgroundRepeat: 'no-repeat',
        }}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  )
}

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

export function Textarea({ label, hint, error, className, ...rest }: TextareaProps) {
  const id = useId()
  return (
    <FieldShell label={label} hint={hint} error={error} id={id}>
      <textarea id={id} rows={3} className={cn(FIELD, 'resize-y', className)} {...rest} />
    </FieldShell>
  )
}