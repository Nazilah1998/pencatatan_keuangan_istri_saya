import { useEffect, useRef } from 'react'
import { useStore } from '@nanostores/react'
import { Trash2, AlertTriangle, Info, X } from 'lucide-react'
import { $confirmState, resolveConfirm } from '../../lib/state/confirm'

export function ConfirmDialog() {
  const state = useStore($confirmState)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (state.isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!state.isOpen && dialog.open) {
      dialog.close()
    }
  }, [state.isOpen])

  if (!state.isOpen) return null

  const isDanger = state.variant === 'danger'
  const isWarning = state.variant === 'warning'

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault()
        resolveConfirm(false)
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          resolveConfirm(false)
        }
      }}
      className="app-modal"
    >
      <div className="flex h-full w-full items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--line-subtle)] bg-[var(--surface-overlay)] p-6 shadow-[var(--shadow-pop)] transition-all animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={() => resolveConfirm(false)}
            aria-label="Tutup"
            className="absolute top-4 right-4 grid size-8 place-items-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)] cursor-pointer focus:outline-none"
          >
            <X className="size-4" aria-hidden />
          </button>

          <div className="flex flex-col items-center text-center">
            <div
              className={`mb-4 grid size-14 place-items-center rounded-2xl ${
                isDanger
                  ? 'bg-[var(--negative-soft)] text-[var(--negative)] ring-8 ring-[var(--negative)]/10'
                  : isWarning
                    ? 'bg-[var(--warning-soft)] text-[var(--warning)] ring-8 ring-[var(--warning)]/10'
                    : 'bg-[var(--accent-soft)] text-[var(--accent)] ring-8 ring-[var(--accent)]/10'
              }`}
            >
              {isDanger ? (
                <Trash2 className="size-6.5" aria-hidden />
              ) : isWarning ? (
                <AlertTriangle className="size-6.5" aria-hidden />
              ) : (
                <Info className="size-6.5" aria-hidden />
              )}
            </div>

            <h3 className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)]">
              {state.title}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)] px-2">
              {state.message}
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={() => resolveConfirm(false)}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] px-5 text-sm font-semibold text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)] active:scale-98 cursor-pointer focus:outline-none sm:w-auto"
            >
              {state.cancelText ?? 'Batal'}
            </button>
            <button
              type="button"
              onClick={() => resolveConfirm(true)}
              className={`inline-flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold text-white shadow-md transition-all active:scale-98 cursor-pointer focus:outline-none sm:w-auto ${
                isDanger
                  ? 'bg-[var(--negative)] hover:bg-[var(--negative)]/90 hover:shadow-[0_4px_16px_var(--negative-soft)]'
                  : isWarning
                    ? 'bg-[var(--warning)] hover:bg-[var(--warning)]/90'
                    : 'bg-[var(--accent)] hover:bg-[var(--accent)]/90'
              }`}
            >
              {state.confirmText ?? 'Lanjutkan'}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}
