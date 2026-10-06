import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type SelectOption = {
  value: string
  label: string
  icon?: ReactNode
  description?: string
  badge?: string
}

type Props = {
  label?: ReactNode
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  hint?: ReactNode
  error?: ReactNode
  disabled?: boolean
  className?: string
  icon?: ReactNode
}

export function ModernSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  hint,
  error,
  disabled = false,
  className = '',
  icon: leadingIcon,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      if (spaceBelow < 240 && rect.top > spaceBelow) {
        setOpenUpward(true)
      } else {
        setOpenUpward(false)
      }
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function handleSelect(optionValue: string) {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={['relative w-full', className].join(' ')}>
      {label && (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={[
          'flex h-11 w-full items-center justify-between rounded-xl border bg-[var(--surface-base)] px-3.5 py-2 text-sm text-[var(--text-primary)] shadow-2xs transition-all duration-200 outline-none',
          error
            ? 'border-[var(--negative)]'
            : isOpen
              ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20'
              : 'border-[var(--line-subtle)] hover:border-[var(--line-strong)]',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]',
        ].join(' ')}
      >
        <div className="flex min-w-0 items-center gap-2.5 truncate">
          {selectedOption?.icon ?? leadingIcon}
          <span
            className={[
              'truncate font-medium',
              selectedOption ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]',
            ].join(' ')}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {selectedOption?.badge && (
            <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-0.5 font-sans text-xs font-bold text-[var(--accent)]">
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={[
              'size-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200',
              isOpen ? 'rotate-180 text-[var(--accent)]' : '',
            ].join(' ')}
          />
        </div>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={[
            'absolute left-0 z-50 max-h-60 w-full overflow-y-auto rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-overlay)] p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in duration-150',
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          ].join(' ')}
        >
          {options.length === 0 ? (
            <div className="px-3.5 py-3 text-center text-xs text-[var(--text-muted)]">
              Tidak ada opsi tersedia
            </div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={[
                    'flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors duration-150',
                    isSelected
                      ? 'bg-[var(--accent-soft)] font-bold text-[var(--accent)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] active:scale-[0.99]',
                  ].join(' ')}
                >
                  <div className="flex min-w-0 items-center gap-2.5 truncate">
                    {option.icon && (
                      <span className="shrink-0 text-[var(--text-secondary)]">{option.icon}</span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{option.label}</p>
                      {option.description && (
                        <p className="truncate text-xs text-[var(--text-muted)]">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {option.badge && (
                      <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-0.5 font-sans text-xs font-semibold text-[var(--text-secondary)]">
                        {option.badge}
                      </span>
                    )}
                    {isSelected && <Check className="size-4 shrink-0 text-[var(--accent)] stroke-[2.5]" />}
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}

      {error ? (
        <p className="mt-1 text-xs text-[var(--negative)]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  )
}
