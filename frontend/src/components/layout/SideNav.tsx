import { useEffect, useState } from 'react'
import { LayoutDashboard, LogOut, Moon, Sun } from 'lucide-react'

import { HouseholdRepo } from '../../lib/api/repositories'
import { useApp } from '../providers/useApp'

import { NAV_ITEMS, NAV_ICONS, isActivePath, usePathname } from './nav'

export function SideNav() {
  const { t, theme, toggleTheme, signOut, session } = useApp()
  const path = usePathname()
  const [mounted, setMounted] = useState(false)
  const [householdName, setHouseholdName] = useState<string>('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!session?.householdId) return
    const cached = window.localStorage.getItem(`sintya.household_name_${session.householdId}`)
    if (cached) setHouseholdName(cached)

    HouseholdRepo.current()
      .then((h) => {
        if (h?.name) {
          setHouseholdName(h.name)
          window.localStorage.setItem(`sintya.household_name_${session.householdId}`, h.name)
        }
      })
      .catch(() => null)

    const onUpdated = (e: Event) => {
      const custom = e as CustomEvent<string>
      if (custom.detail) setHouseholdName(custom.detail)
    }
    window.addEventListener('household:updated', onUpdated)
    return () => window.removeEventListener('household:updated', onUpdated)
  }, [session?.householdId])

  const initial = (mounted && session?.name ? session.name.charAt(0).toUpperCase() : null) ?? 'S'

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col py-6 lg:flex">
      <a href="/" className="mb-6 flex items-center gap-2.5 px-3">
        <span className="grid size-9 place-items-center rounded-[0.625rem] bg-[var(--accent-soft)] font-display text-base font-bold text-[var(--accent)]">
          {initial}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-base font-semibold leading-tight">
            {mounted && session?.name ? session.name : t('app.name')}
          </span>
          <span className="block truncate text-xs text-[var(--text-muted)]">
            {mounted && householdName ? `🏠 ${householdName}` : t('app.tagline')}
          </span>
        </span>
      </a>

      <nav className="flex-1 space-y-1" aria-label={t('sidebar.dashboard')}>
        {NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.icon] ?? LayoutDashboard
          const active = isActivePath(path, item.href)
          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex items-center gap-3 rounded-[0.75rem] px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              <Icon className="size-4.5 shrink-0" aria-hidden />
              <span className="truncate">{t(item.label)}</span>
            </a>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-[var(--line-subtle)] pt-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-[0.75rem] px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
        >
          {theme === 'dark' ? <Sun className="size-4.5 text-[var(--warning)]" aria-hidden /> : <Moon className="size-4.5 text-sky-500" aria-hidden />}
          <span>{t('app.toggle_theme')}</span>
        </button>

        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-[0.75rem] px-3 py-2.5 text-sm font-semibold text-[var(--negative)] transition-colors hover:bg-[var(--negative-soft)]"
        >
          <LogOut className="size-4.5" aria-hidden />
          <span>{t('auth.sign_out')}</span>
        </button>
      </div>
    </aside>
  )
}