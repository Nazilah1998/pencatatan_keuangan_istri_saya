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
      className="m-0 h-full max-h-full w-full max-w-none bg-transparent p-0 backdrop:bg-black/60 sm:m-auto sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:p-0"
    >
      <div className="flex max-h-full flex-col overflow-hidden rounded-none border border-[var(--line-subtle)] bg-[var(--surface-overlay)] shadow-[var(--shadow-modal)] sm:rounded-[var(--radius-tile)]">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--line-subtle)] px-4 py-3">
          <h2 className="truncate text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid size-8 shrink-0 place-items-center rounded-[0.5rem] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]"
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>

        {footer && (
          <footer className="flex justify-end gap-2 border-t border-[var(--line-subtle)] px-4 py-3">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  )
}