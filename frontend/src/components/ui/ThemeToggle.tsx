import { Moon, Sun } from 'lucide-react'

import { useApp } from '../providers/useApp'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { t, theme, toggleTheme } = useApp()
  const nextLabel = theme === 'dark' ? t('app.theme_light') : t('app.theme_dark')

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={nextLabel}
      title={nextLabel}
      className={[
        'grid size-9 shrink-0 place-items-center rounded-[0.625rem] border border-[var(--line-subtle)]',
        'text-[var(--text-secondary)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]',
        className,
      ].join(' ')}
    >
      {theme === 'dark' ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </button>
  )
}