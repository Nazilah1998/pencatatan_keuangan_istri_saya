/**
 * Dialog modal tanpa dependensi eksternal.
 *
 * Memakai elemen `<dialog>` native supaya focus trapping, tombol Escape untuk
 * menutup, dan backdrop sudah ditangani browser. State `open` dikendalikan
 * React; `onClose` dipanggil saat pengguna menekan Escape atau backdrop.
 */
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, title, onClose, children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // Backdrop adalah area dialog itu sendiri, bukan descendant-nya.
        if (event.target === ref.current) onClose()
      }}
      className="app-modal"
    >
      <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--surface-overlay)] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-[var(--line-subtle)] sm:shadow-[var(--shadow-pop)]">
        <header className="safe-top flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line-subtle)] bg-[var(--surface-overlay)] px-4 py-3 sm:py-3.5">
          <h2 className="truncate font-display text-base font-bold tracking-tight text-[var(--text-primary)] sm:text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)] active:scale-95"
          >
            <X className="size-4.5" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>

        {footer && (
          <footer className="safe-bottom flex shrink-0 justify-end gap-2 border-t border-[var(--line-subtle)] bg-[var(--surface-overlay)] px-4 py-3">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  )
}