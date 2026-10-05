/**
 * Navigasi yang dipakai bersama sidebar desktop dan bottom bar mobile.
 *
 * Hanya komponen ini yang membaca `NAV_ITEMS`; halaman .astro tidak pernah
 * merender daftar nav secara manual.
 */
import { useEffect, useState } from 'react'
import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import { NAV_ITEMS } from '../../lib/constants/navigation'

export const NAV_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  Building2,
  BarChart3,
  Settings,
}

/** Pathname aktif, dipakai kedua navigasi. */
export function usePathname(): string {
  const [path, setPath] = useState('/')

  useEffect(() => {
    const sync = () => setPath(window.location.pathname.replace(/\/+$/, '') || '/')
    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  return path
}

export function isActivePath(path: string, href: string): boolean {
  return href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`)
}

export { NAV_ITEMS }