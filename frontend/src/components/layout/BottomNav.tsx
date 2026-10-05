/**
 * Bottom tab bar untuk layar kecil. Hanya 5 menu utama; sisanya ada di
 * halaman lain (FAB / menuoverflow).
 */
import { LayoutDashboard } from 'lucide-react'

import { useApp } from '../providers/useApp'

import { NAV_ITEMS, NAV_ICONS, isActivePath, usePathname } from './nav'

export function BottomNav() {
  const { t } = useApp()
  const path = usePathname()

  const items = NAV_ITEMS.slice(0, 5)

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line-subtle)] bg-[var(--surface-base)]/95 backdrop-blur lg:hidden"
      aria-label={t('sidebar.dashboard')}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-1.5">
        {items.map((item) => {
          const Icon = NAV_ICONS[item.icon] ?? LayoutDashboard
          const active = isActivePath(path, item.href)

          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[0.625rem] px-1 py-1.5 text-[0.625rem] transition-colors',
                active
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              ].join(' ')}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="w-full truncate text-center">{t(item.label)}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}