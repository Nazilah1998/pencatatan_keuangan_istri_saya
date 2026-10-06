/**
 * Hook tunggal untuk membaca state global. Menggantikan React context karena
 * tiap island Astro adalah root terpisah.
 */
import { useMemo } from 'react'
import { useStore } from '@nanostores/react'

import { translateFn, appActions, $dict, $drawerOpen, $lang, $ready, $session, $theme } from '../../lib/state/app'
import { translate as msg, type MessageKey } from '../../lib/utils/messages'

export function useApp() {
  const theme = useStore($theme)
  const lang = useStore($lang)
  const dict = useStore($dict)
  const session = useStore($session)
  const ready = useStore($ready)
  const drawerOpen = useStore($drawerOpen)

  return useMemo(
    () => ({
      theme,
      setTheme: appActions.setTheme,
      toggleTheme: appActions.toggleTheme,
      lang,
      setLang: appActions.setLang,
      t: translateFn(dict),
      m: (key: MessageKey) => msg(key, lang === 'id' ? 'id' : 'en'),
      session,
      ready,
      drawerOpen,
      toggleDrawer: appActions.toggleDrawer,
      setDrawerOpen: appActions.setDrawerOpen,
      signOut: appActions.signOut,
      isAuthed: !!session,
    }),
    [theme, lang, dict, session, ready, drawerOpen],
  )
}