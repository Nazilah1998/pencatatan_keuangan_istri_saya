/** Mengarahkan pengguna yang sudah punya sesi langsung ke dasbor. */
import { useEffect } from 'react'

import { useApp } from '../providers/useApp'

export function RedirectIfAuthed() {
  const { ready, isAuthed } = useApp()

  useEffect(() => {
    if (ready && isAuthed) window.location.replace('/')
  }, [ready, isAuthed])

  return null
}