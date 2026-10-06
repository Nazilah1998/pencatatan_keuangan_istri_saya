import { useEffect } from 'react'
import {
  Globe,
  LogOut,
  Moon,
  Sun,
  X,
  type LucideIcon,
  LayoutDashboard,
} from 'lucide-react'

import { useApp } from '../providers/useApp'
import { NAV_ITEMS, NAV_ICONS, isActivePath, usePathname } from './nav'

export function MobileDrawer() {
  const {
    t,
    theme,
    toggleTheme,
    lang,
    setLang,
    signOut,
    session,
    drawerOpen,
    setDrawerOpen,
  } = useApp()
  const path = usePathname()

  useEffect(() => {
    if (!drawerOpen) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [drawerOpen, setDrawerOpen])

  if (!drawerOpen) return null

  const initial = session?.name?.charAt(0).toUpperCase() ?? 'S'

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-[var(--line-subtle)] bg-[var(--surface-base)] shadow-2xl animate-in slide-in-from-left duration-250">
        <div className="flex items-center justify-between border-b border-[var(--line-subtle)] px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-[var(--accent)] font-display text-sm font-bold text-[var(--text-inverted)]">
              S
            </span>
            <span className="font-display font-semibold text-[var(--text-primary)]">
              {t('app.name')}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Tutup menu"
            className="grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)] transition-colors active:scale-95"
          >
            <X className="size-5" />
          </button>
        </div>

        {session && (
          <div className="border-b border-[var(--line-subtle)] bg-[var(--surface-sunken)]/50 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[var(--accent-soft)] font-display text-base font-bold text-[var(--accent)]">
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold text-[var(--text-primary)]">
                  {session.name}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">{session.email}</p>
              </div>
            </div>
            {session.householdId && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[0.6875rem] font-medium text-[var(--accent)]">
                <span>🏠</span>
                <span className="truncate">Keluarga</span>
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Menu navigasi">
          {NAV_ITEMS.map((item) => {
            const Icon: LucideIcon = NAV_ICONS[item.icon] ?? LayoutDashboard
            const active = isActivePath(path, item.href)

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={[
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.98]',
                  active
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                <Icon className={['size-5 shrink-0 transition-transform', active ? 'scale-110' : ''].join(' ')} />
                <span className="truncate">{t(item.label)}</span>
              </a>
            )
          })}
        </nav>

        <div className="space-y-2 border-t border-[var(--line-subtle)] p-3">
          <div className="flex items-center justify-between rounded-xl bg-[var(--surface-sunken)] p-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-95"
            >
              {theme === 'dark' ? <Sun className="size-4 text-[var(--warning)]" /> : <Moon className="size-4" />}
              <span>{theme === 'dark' ? t('app.theme_light') : t('app.theme_dark')}</span>
            </button>

            <span className="h-4 w-px bg-[var(--line-subtle)]" />

            <button
              type="button"
              onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-95"
            >
              <Globe className="size-4 text-[var(--accent)]" />
              <span className="uppercase">{lang}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false)
              signOut()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line-subtle)] px-3 py-2 text-xs font-semibold text-[var(--negative)] hover:bg-[var(--negative-soft)] transition-colors active:scale-[0.98]"
          >
            <LogOut className="size-4" />
            <span>{t('auth.sign_out')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
