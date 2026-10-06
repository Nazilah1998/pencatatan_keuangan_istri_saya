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

  return null
}