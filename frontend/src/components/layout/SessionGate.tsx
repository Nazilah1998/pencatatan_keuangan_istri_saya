/**
 * Penjaga sesi sisi klien.
 *
 * Halaman tetap dibangun statis tanpa data pengguna. Island ini hanya
 * memastikan tidak ada antarmuka yang terlihat sebelum session diketahui, dan
 * mengarahkan tamu ke /masuk. Proteksi sesungguhnya tetap di rule PocketBase.
 */
import { useEffect } from 'react'

import { useApp } from '../providers/useApp'

export function SessionGate() {
  const { ready, isAuthed } = useApp()

  useEffect(() => {
    if (ready && !isAuthed) {
      const next = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.replace(`/masuk?next=${next}`)
    }
  }, [ready, isAuthed])

  if (ready && isAuthed) return null

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[var(--surface-base)]">
      <span
        aria-label="Memuat"
        className="size-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent"
      />
    </div>
  )
}