import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'

import { formatDate, todayISO } from '../../lib/utils/date'

type Props = {
  label?: ReactNode
  value: string
  onChange: (date: string) => void
  placeholder?: string
  allowClear?: boolean
  hint?: ReactNode
  error?: ReactNode
  disabled?: boolean
  className?: string
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export function ModernDatePicker({
  label,
  value,
  onChange,
  placeholder = 'Pilih tanggal...',
  allowClear = false,
  hint,
  error,
  disabled = false,
  className = '',
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const initialDate = value ? new Date(value + 'T00:00:00') : new Date()
  const safeDate = Number.isNaN(initialDate.getTime()) ? new Date() : initialDate
  const [viewYear, setViewYear] = useState(safeDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(safeDate.getMonth())

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00')
      if (!Number.isNaN(d.getTime())) {
        setViewYear(d.getFullYear())
        setViewMonth(d.getMonth())
      }
    }
  }, [value])

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

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  function selectDate(year: number, month: number, day: number) {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onChange(formatted)
    setIsOpen(false)
  }

  function setToday() {
    const today = todayISO()
    onChange(today)
    setIsOpen(false)
  }

  function setYesterday() {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const yest = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    onChange(yest)
    setIsOpen(false)
  }

  // Perhitungan kalender
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const today = todayISO()
  const isTodaySelected = value === today

  return (
    <div ref={containerRef} className={['relative w-full', className].join(' ')}>
      {label && (
        <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <span>{label}</span>
          <div className="flex items-center gap-1.5 font-normal normal-case">
            <button
              type="button"
              disabled={disabled}
              onClick={setToday}
              className={[
                'rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium transition-colors',
                isTodaySelected
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              Hari ini
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={setYesterday}
              className="rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]"
            >
              Kemarin
            </button>
          </div>
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
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
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon className="size-4 shrink-0 text-[var(--accent)]" />
          <span className={['truncate font-medium', value ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'].join(' ')}>
            {value ? formatDate(value, 'short') : placeholder}
          </span>
        </div>

        {value && isTodaySelected && (
          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[0.625rem] font-bold text-[var(--accent)]">
            Hari ini
          </span>
        )}
      </button>

      {/* Floating Calendar Popover */}
      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[17.5rem] max-w-[20rem] rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-overlay)] p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-label="Pilih tanggal"
        >
          {/* Header Kalender */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[var(--line-subtle)]">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Bulan sebelumnya"
              className="grid size-7 place-items-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)] transition-colors active:scale-95"
            >
              <ChevronLeft className="size-4" />
            </button>

            <span className="font-display text-xs font-bold text-[var(--text-primary)]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              aria-label="Bulan berikutnya"
              className="grid size-7 place-items-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)] transition-colors active:scale-95"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Nama Hari */}
          <div className="grid grid-cols-7 pt-2.5 pb-1 text-center">
            {DAY_NAMES.map((day) => (
              <span key={day} className="text-[0.6875rem] font-semibold text-[var(--text-muted)]">
                {day}
              </span>
            ))}
          </div>

          {/* Grid Tanggal */}
          <div className="grid grid-cols-7 gap-1">
            {/* Hari bulan sebelumnya */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => {
              const dayNum = daysInPrevMonth - firstDayOfWeek + i + 1
              return (
                <span
                  key={`prev-${i}`}
                  className="grid size-8 place-items-center text-xs text-[var(--text-muted)]/30 font-medium"
                >
                  {dayNum}
                </span>
              )
            })}

            {/* Hari bulan ini */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
              const isSelected = value === dateStr
              const isCurrentDay = today === dateStr

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => selectDate(viewYear, viewMonth, dayNum)}
                  className={[
                    'grid size-8 place-items-center rounded-xl text-xs font-medium transition-all duration-150',
                    isSelected
                      ? 'bg-[var(--accent)] text-[var(--text-inverted)] font-bold shadow-xs scale-105'
                      : isCurrentDay
                        ? 'border border-[var(--accent)] text-[var(--accent)] font-semibold hover:bg-[var(--accent-soft)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] active:scale-95',
                  ].join(' ')}
                >
                  {dayNum}
                </button>
              )
            })}
          </div>

          {/* Footer Shortcuts */}
          <div className="mt-3 flex items-center justify-between border-t border-[var(--line-subtle)] pt-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={setToday}
                className="text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                Pilih Hari Ini
              </button>
              {allowClear && value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('')
                    setIsOpen(false)
                  }}
                  className="text-xs font-semibold text-[var(--negative)] hover:underline"
                >
                  Hapus
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="size-3.5" />
              <span>Tutup</span>
            </button>
          </div>
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
