/**
 * Bottom tab bar untuk layar kecil. Hanya 5 menu utama; sisanya ada di
 * halaman lain (FAB / menuoverflow).
 */
import { LayoutDashboard, Menu } from 'lucide-react'

import { useApp } from '../providers/useApp'

import { NAV_ITEMS, NAV_ICONS, isActivePath, usePathname } from './nav'

export function BottomNav() {
  const { t, toggleDrawer, drawerOpen } = useApp()
  const path = usePathname()

  const mainItems = NAV_ITEMS.slice(0, 4)

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line-subtle)] bg-[var(--surface-base)]/95 shadow-lg backdrop-blur-md lg:hidden"
      aria-label={t('sidebar.dashboard')}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-1.5 pb-1">
        {mainItems.map((item) => {
          const Icon = NAV_ICONS[item.icon] ?? LayoutDashboard
          const active = isActivePath(path, item.href)

          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1 text-[0.6875rem] font-medium transition-all active:scale-95',
                active
                  ? 'text-[var(--accent)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              ].join(' ')}
            >
              <div
                className={[
                  'grid size-7 place-items-center rounded-lg transition-transform',
                  active ? 'bg-[var(--accent-soft)] scale-105' : '',
                ].join(' ')}
              >
                <Icon className="size-4.5 shrink-0" aria-hidden />
              </div>
              <span className="w-full truncate text-center">{t(item.label)}</span>
            </a>
          )
        })}

        <button
          type="button"
          onClick={toggleDrawer}
          aria-expanded={drawerOpen}
          aria-label="Menu navigasi lengkap"
          className={[
            'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1 text-[0.6875rem] font-medium transition-all active:scale-95',
            drawerOpen
              ? 'text-[var(--accent)] font-semibold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
          ].join(' ')}
        >
          <div
            className={[
              'grid size-7 place-items-center rounded-lg transition-transform',
              drawerOpen ? 'bg-[var(--accent-soft)] scale-105' : '',
            ].join(' ')}
          >
            <Menu className="size-4.5 shrink-0" aria-hidden />
          </div>
          <span className="w-full truncate text-center">Menu</span>
        </button>
      </div>
    </nav>
  )
}