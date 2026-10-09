import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Database,
  Download,
  Globe,
  Info,
  LogOut,
  Moon,
  Palette,
  Pencil,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Tag,
  Trash2,
  Upload,
  User,
  Wallet as WalletIcon,
  X,
} from 'lucide-react'

import { api, ApiError, ApiPaths } from '../../lib/api/client'
import type { PinStatus } from '../../lib/api/types'
import {
  CategoryRepo,
  HouseholdRepo,
  SubCategoryRepo,
  UserRepo,
  WalletRepo,
  type Category,
  type SubCategory,
  type Wallet,
  type WalletType,
} from '../../lib/api/repositories'
import { formatMoney, parseAmount } from '../../lib/utils/currency'
import { LANGUAGES } from '../../lib/i18n'
import type { LangCode } from '../../lib/i18n'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Field'
import { ModernSelect } from '../ui/ModernSelect'
import { confirmAction, confirmDelete } from '../../lib/state/confirm'

type CategoryKind = 'income' | 'expense'
type SettingSubMenu =
  | 'profile'
  | 'pin'
  | 'theme'
  | 'language'
  | 'wallets'
  | 'categories'
  | 'backup'
  | 'about'

const WALLET_TYPE_OPTIONS: { value: WalletType; label: string; icon: string }[] = [
  { value: 'cash', label: 'Uang Tunai (Cash)', icon: '💵' },
  { value: 'bank', label: 'Rekening Bank', icon: '🏦' },
  { value: 'ewallet', label: 'E-Wallet / Dompet Digital', icon: '📱' },
  { value: 'savings', label: 'Tabungan Khusus', icon: '🐷' },
  { value: 'credit_card', label: 'Kartu Kredit', icon: '💳' },
  { value: 'investment', label: 'Investasi', icon: '📈' },
]

function getWalletTypeMeta(type: WalletType) {
  switch (type) {
    case 'cash':
      return {
        label: 'Tunai',
        icon: '💵',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      }
    case 'bank':
      return {
        label: 'Bank',
        icon: '🏦',
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      }
    case 'ewallet':
      return {
        label: 'E-Wallet',
        icon: '📱',
        badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      }
    case 'savings':
      return {
        label: 'Tabungan',
        icon: '🐷',
        badgeClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
      }
    case 'credit_card':
      return {
        label: 'Kartu Kredit',
        icon: '💳',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      }
    case 'investment':
      return {
        label: 'Investasi',
        icon: '📈',
        badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
      }
    default:
      return {
        label: 'Lainnya',
        icon: '👛',
        badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      }
  }
}

export function SettingsScreen() {
  const { t, m, lang, setLang, theme, setTheme, signOut, isAuthed, session } = useApp()

  const [selectedMenu, setSelectedMenu] = useState<SettingSubMenu | null>(null)

  const [householdName, setHouseholdName] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [subs, setSubs] = useState<SubCategory[]>([])
  const [kind, setKind] = useState<CategoryKind>('expense')
  const [newCategory, setNewCategory] = useState('')
  const [newSub, setNewSub] = useState('')
  const [subParent, setSubParent] = useState('')

  const [wallets, setWallets] = useState<Wallet[]>([])
  const [walletName, setWalletName] = useState('')
  const [walletType, setWalletType] = useState<WalletType>('bank')
  const [walletInitialBalance, setWalletInitialBalance] = useState('')
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)

  const [pin, setPin] = useState<PinStatus | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinOld, setPinOld] = useState('')
  const [pinBusy, setPinBusy] = useState(false)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError('')

    try {
      const [household, list, subList, pinStatus, walletList] = await Promise.all([
        HouseholdRepo.current().catch(() => null),
        CategoryRepo.list(),
        SubCategoryRepo.list(),
        api.get<PinStatus>(ApiPaths.pinStatus).catch(() => null),
        WalletRepo.list(true).catch(() => []),
      ])

      if (household) setHouseholdName(household.name)
      setCategories(list)
      setSubs(subList)
      setPin(pinStatus)
      setWallets(walletList)
      if (list[0] && !subParent) {
        setSubParent(list[0].id)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
    }
  }, [m, subParent])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => {
      setNotice('')
    }, 3500)
    return () => clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => {
      setError('')
    }, 4500)
    return () => clearTimeout(timer)
  }, [error])

  const visibleCategories = categories.filter((c) => c.type === kind)
  const visibleSubs = subs.filter((s) => s.category === subParent)

  async function run(action: () => Promise<void>, okMessage?: string) {
    setBusy(true)
    setError('')
    setNotice('')

    try {
      await action()
      if (okMessage) setNotice(okMessage)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
    } finally {
      setBusy(false)
    }
  }

  async function saveHousehold() {
    if (!householdName.trim()) {
      setError(m('auth.householdRequired'))
      return
    }

    await run(async () => {
      await HouseholdRepo.update({ name: householdName.trim() })
      if (session?.householdId) {
        window.localStorage.setItem(`sintya.household_name_${session.householdId}`, householdName.trim())
      }
      window.dispatchEvent(new CustomEvent('household:updated', { detail: householdName.trim() }))
    }, 'Nama rumah tangga berhasil disimpan')
  }

  async function addCategory() {
    if (!newCategory.trim()) {
      setError(m('category.nameRequired'))
      return
    }

    if (categories.some((c) => c.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      setError(m('category.duplicateName'))
      return
    }

    await run(async () => {
      await CategoryRepo.create({ name: newCategory.trim(), type: kind })
      setNewCategory('')
      await load()
    }, 'Kategori berhasil ditambahkan')
  }

  async function removeCategory(category: Category) {
    const ok = await confirmDelete('Hapus Kategori?', t('common.delete_confirm_desc'))
    if (!ok) return

    await run(async () => {
      await CategoryRepo.remove(category.id)
      await load()
    }, 'Kategori berhasil dihapus')
  }

  async function addSubCategory() {
    if (!newSub.trim() || !subParent) {
      setError(m('category.nameRequired'))
      return
    }

    await run(async () => {
      await SubCategoryRepo.create({ name: newSub.trim(), category: subParent })
      setNewSub('')
      await load()
    }, 'Sub-kategori berhasil ditambahkan')
  }

  async function savePin() {
    if (pinInput.length < 4) {
      setError(m('pin.minLength'))
      return
    }

    if (pinConfirm && pinInput !== pinConfirm) {
      setError('Konfirmasi PIN tidak sama')
      return
    }

    if (pin?.hasPin && !pinOld) {
      setError(m('pin.needOld'))
      return
    }

    setPinBusy(true)
    setError('')

    try {
      const updated = await api.post<PinStatus>(ApiPaths.pinSet, {
        pin: pinInput,
        confirmed: pinConfirm || pinInput,
        old_pin: pin?.hasPin ? pinOld : '',
      })
      setPin(updated)
      setPinInput('')
      setPinConfirm('')
      setPinOld('')
      setNotice('PIN keamanan berhasil diperbarui')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
    } finally {
      setPinBusy(false)
    }
  }

  async function removePin() {
    if (!pinOld) {
      setError('Masukkan PIN saat ini untuk menghapusnya')
      return
    }

    const ok = await confirmAction({
      title: 'Hapus PIN Keamanan?',
      message: 'Proteksi PIN keamanan akan dinonaktifkan dari aplikasi ini.',
      confirmText: 'Hapus PIN',
      cancelText: 'Batal',
      variant: 'warning',
    })
    if (!ok) return

    setPinBusy(true)
    setError('')

    try {
      const updated = await api.delete<PinStatus>(ApiPaths.pinStatus, {
        pin: pinOld,
      })
      setPin(updated)
      setPinOld('')
      setPinInput('')
      setPinConfirm('')
      setNotice('PIN keamanan berhasil dihapus')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
    } finally {
      setPinBusy(false)
    }
  }

  async function changeTheme(newTheme: 'light' | 'dark') {
    setTheme(newTheme)
    setNotice(`Tema diubah ke mode ${newTheme === 'dark' ? 'gelap' : 'terang'}`)
  }

  async function changeLang(newLang: LangCode) {
    await setLang(newLang)
    await HouseholdRepo.update({ language: newLang }).catch(() => null)
    await UserRepo.updateProfile({ language: newLang }).catch(() => null)
    setNotice('Bahasa antarmuka berhasil diubah')
  }

  async function restore(file: File) {
    await run(async () => {
      const text = await file.text()
      const parsed = JSON.parse(text) as Record<string, unknown>
      const payload = parsed.data ? parsed : { replace: false, data: parsed }
      await api.post(ApiPaths.restore, payload)
      await load()
    }, 'Data berhasil dipulihkan dari berkas cadangan')
  }

  function startEditWallet(w: Wallet) {
    setEditingWallet(w)
    setWalletName(w.name)
    setWalletType(w.type)
    setWalletInitialBalance('')
    setError('')
    setNotice('')
  }

  function cancelEditWallet() {
    setEditingWallet(null)
    setWalletName('')
    setWalletType('bank')
    setWalletInitialBalance('')
  }

  async function moveWalletOrder(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= wallets.length) return

    const newWallets = [...wallets]
    const current = newWallets[index]
    const target = newWallets[targetIndex]
    if (!current || !target) return

    newWallets[index] = target
    newWallets[targetIndex] = current

    const updatedWallets = newWallets.map((w, idx) => ({
      ...w,
      sortOrder: idx + 1,
    }))
    setWallets(updatedWallets)

    try {
      const orderMap: Record<string, number> = {}
      updatedWallets.forEach((w) => {
        orderMap[w.id] = w.sortOrder
      })
      localStorage.setItem('sintya.wallet_order', JSON.stringify(orderMap))

      await Promise.all([
        WalletRepo.update(current.id, { sortOrder: targetIndex + 1 }).catch(() => null),
        WalletRepo.update(target.id, { sortOrder: index + 1 }).catch(() => null),
      ])
      window.dispatchEvent(new CustomEvent('tx:created'))
    } catch {
      void load()
    }
  }

  async function addWallet() {
    if (!walletName.trim()) {
      setError('Nama dompet wajib diisi')
      return
    }

    if (wallets.some((w) => w.name.toLowerCase() === walletName.trim().toLowerCase())) {
      setError('Nama dompet sudah terdaftar. Gunakan nama lain.')
      return
    }

    await run(async () => {
      const initial = parseAmount(walletInitialBalance)
      await WalletRepo.create({
        name: walletName.trim(),
        type: walletType,
        initialBalance: initial,
        balance: initial,
        includeInNetWorth: true,
        isArchived: false,
        sortOrder: wallets.length + 1,
      })
      setWalletName('')
      setWalletInitialBalance('')
      window.dispatchEvent(new CustomEvent('tx:created'))
      await load()
    }, 'Dompet berhasil ditambahkan')
  }

  async function saveEditWallet() {
    if (!editingWallet) return
    if (!walletName.trim()) {
      setError('Nama dompet wajib diisi')
      return
    }

    if (
      wallets.some(
        (w) => w.id !== editingWallet.id && w.name.toLowerCase() === walletName.trim().toLowerCase(),
      )
    ) {
      setError('Nama dompet sudah terdaftar. Gunakan nama lain.')
      return
    }

    await run(async () => {
      await WalletRepo.update(editingWallet.id, {
        name: walletName.trim(),
        type: walletType,
      })
      cancelEditWallet()
      window.dispatchEvent(new CustomEvent('tx:created'))
      await load()
    }, 'Dompet berhasil diperbarui')
  }

  async function removeWallet(wallet: Wallet) {
    const ok = await confirmDelete(
      `Hapus Dompet "${wallet.name}"?`,
      'Jika dompet ini memiliki riwayat transaksi, sistem akan meminta konfirmasi pengarsipan agar catatan keuangan tetap konsisten.',
    )
    if (!ok) return

    await run(async () => {
      try {
        await WalletRepo.remove(wallet.id)
        if (editingWallet?.id === wallet.id) {
          cancelEditWallet()
        }
        window.dispatchEvent(new CustomEvent('tx:created'))
        await load()
      } catch {
        const archiveOk = await confirmAction({
          title: 'Dompet Memiliki Riwayat Transaksi',
          message: `Dompet "${wallet.name}" tidak dapat dihapus permanen karena masih terkait dengan data transaksi. Apakah Anda ingin mengarsipkannya agar tidak muncul di pilihan transaksi?`,
          confirmText: 'Arsipkan Dompet',
          cancelText: 'Batal',
          variant: 'warning',
        })
        if (archiveOk) {
          await WalletRepo.update(wallet.id, { isArchived: true })
          if (editingWallet?.id === wallet.id) {
            cancelEditWallet()
          }
          window.dispatchEvent(new CustomEvent('tx:created'))
          await load()
        }
      }
    }, 'Daftar dompet berhasil diperbarui')
  }

  async function toggleArchiveWallet(wallet: Wallet) {
    const nextStatus = !wallet.isArchived
    const ok = await confirmAction({
      title: nextStatus ? 'Arsipkan Dompet?' : 'Aktifkan Kembali Dompet?',
      message: nextStatus
        ? `Dompet "${wallet.name}" akan disembunyikan dari pilihan dompet transaksi. Riwayat transaksi sebelumnya tetap aman.`
        : `Dompet "${wallet.name}" akan ditampilkan kembali pada pilihan dompet transaksi.`,
      confirmText: nextStatus ? 'Arsipkan' : 'Aktifkan',
      cancelText: 'Batal',
      variant: 'info',
    })
    if (!ok) return

    await run(async () => {
      await WalletRepo.update(wallet.id, { isArchived: nextStatus })
      window.dispatchEvent(new CustomEvent('tx:created'))
      await load()
    }, nextStatus ? 'Dompet berhasil diarsipkan' : 'Dompet berhasil diaktifkan kembali')
  }

  const MENU_ITEMS = [
    {
      id: 'profile' as const,
      title: 'Profil Rumah Tangga',
      icon: User,
    },
    {
      id: 'pin' as const,
      title: 'Keamanan PIN',
      icon: Shield,
    },
    {
      id: 'theme' as const,
      title: 'Tema Tampilan',
      icon: Palette,
    },
    {
      id: 'language' as const,
      title: 'Bahasa Antarmuka',
      icon: Globe,
    },
    {
      id: 'wallets' as const,
      title: 'Kelola Dompet & Akun',
      icon: WalletIcon,
    },
    {
      id: 'categories' as const,
      title: 'Kategori & Sub-Kategori',
      icon: Tag,
    },
    {
      id: 'backup' as const,
      title: 'Cadangan & Pulihkan Data',
      icon: Database,
    },
    {
      id: 'about' as const,
      title: 'Informasi Aplikasi',
      icon: Info,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Alert Notifikasi / Error */}
      {error && (
        <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-[var(--negative)]/20 bg-[var(--negative-soft)] p-3.5 text-xs font-semibold text-[var(--negative)] animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xs">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <AlertCircle className="size-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => setError('')}
            className="grid size-6 place-items-center rounded-lg hover:bg-[var(--negative)]/10 text-[var(--negative)] shrink-0 transition-colors cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-3.5 text-xs font-semibold text-[var(--accent)] animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xs">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Check className="size-4 shrink-0 stroke-[2.5]" />
            <span className="flex-1">{notice}</span>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => setNotice('')}
            className="grid size-6 place-items-center rounded-lg hover:bg-[var(--accent)]/10 text-[var(--accent)] shrink-0 transition-colors cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* VIEW 1: MENU UTAMA PENGATURAN (SUB-MENU LIST) */}
      {!selectedMenu && (
        <div className="space-y-4 pt-1 animate-in fade-in duration-150">
          <div className="space-y-2.5">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedMenu(item.id)
                    setError('')
                    setNotice('')
                  }}
                  className="flex w-full items-center justify-between gap-3.5 rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-base)] px-4 py-3.5 shadow-2xs transition-all hover:border-[var(--accent)] hover:shadow-xs active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="grid size-9.5 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                      <Icon className="size-4.5" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {item.title}
                    </span>
                  </div>

                  <ChevronRight className="size-4.5 text-[var(--text-muted)]" />
                </button>
              )
            })}
          </div>

          {/* Sesi Keluar Akun */}
          {isAuthed && (
            <div className="pt-3">
              <button
                type="button"
                onClick={async () => {
                  const ok = await confirmAction({
                    title: 'Keluar dari Akun?',
                    message: 'Anda akan mengakhiri sesi masuk pada perangkat ini.',
                    confirmText: 'Keluar',
                    cancelText: 'Batal',
                    variant: 'warning',
                  })
                  if (ok) signOut()
                }}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[var(--negative)]/25 bg-[var(--negative-soft)] py-3.5 px-4 text-xs font-bold text-[var(--negative)] shadow-2xs transition-all hover:bg-[var(--negative)]/15 active:scale-[0.99]"
              >
                <LogOut className="size-4" />
                <span>{t('auth.sign_out')}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SUB-MENU DETAIL VIEW (DENGAN TOMBOL KEMBALI) */}
      {selectedMenu && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Tombol Kembali ke Pengaturan */}
          <div>
            <button
              type="button"
              onClick={() => {
                setSelectedMenu(null)
                setError('')
                setNotice('')
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-base)] px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)] active:scale-95 shadow-2xs"
            >
              <ArrowLeft className="size-4 text-[var(--accent)]" />
              <span>Kembali ke Pengaturan</span>
            </button>
          </div>

          {/* 1. SUB-MENU: PROFIL */}
          {selectedMenu === 'profile' && (
            <Card title="Profil Rumah Tangga" subtitle="Ubah nama akun rumah tangga Anda">
              <div className="space-y-3.5">
                <Input
                  label="Nama Rumah Tangga"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="Contoh: Nazilah ❤️ Sintya"
                />
                <Button loading={busy} onClick={() => void saveHousehold()}>
                  {t('common.save')}
                </Button>
              </div>
            </Card>
          )}

          {/* 2. SUB-MENU: PIN KEAMANAN */}
          {selectedMenu === 'pin' && (
            <Card
              title="Keamanan PIN"
              subtitle={
                pin?.hasPin
                  ? 'PIN 4-digit aktif melindungi aplikasi'
                  : 'Pasang PIN untuk mengunci akses aplikasi saat dibuka'
              }
            >
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)]/60 p-3 text-xs">
                  {pin?.hasPin ? (
                    <>
                      <ShieldCheck className="size-4 text-[var(--accent)]" />
                      <span className="font-medium text-[var(--text-primary)]">
                        Status: <strong className="text-[var(--accent)]">PIN Aktif</strong>
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="size-4 text-[var(--warning)]" />
                      <span className="font-medium text-[var(--text-secondary)]">
                        Status: Belum ada PIN dipasang
                      </span>
                    </>
                  )}
                </div>

                {pin?.hasPin && (
                  <Input
                    label="PIN Saat Ini"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinOld}
                    onChange={(e) => setPinOld(e.target.value)}
                    placeholder="••••"
                  />
                )}

                <Input
                  label={pin?.hasPin ? 'PIN Baru' : 'Buat PIN 4-Digit'}
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  hint={m('pin.minLength')}
                />

                <Input
                  label="Konfirmasi PIN"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value)}
                  placeholder="••••"
                />

                <div className="flex items-center gap-2 pt-1">
                  <Button loading={pinBusy} onClick={() => void savePin()}>
                    {pin?.hasPin ? 'Perbarui PIN' : 'Pasang PIN'}
                  </Button>

                  {pin?.hasPin && (
                    <Button
                      variant="danger"
                      loading={pinBusy}
                      onClick={() => void removePin()}
                    >
                      Hapus PIN
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* 3. SUB-MENU: TEMA */}
          {selectedMenu === 'theme' && (
            <Card title="Tema Aplikasi" subtitle="Sesuaikan skema warna tampilan antarmuka">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => void changeTheme('light')}
                  className={[
                    'flex flex-col items-center justify-center gap-2.5 rounded-2xl border p-4 text-center transition-all duration-150 active:scale-95',
                    theme === 'light'
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-bold shadow-xs'
                      : 'border-[var(--line-subtle)] bg-[var(--surface-base)] text-[var(--text-secondary)] hover:border-[var(--line-strong)]',
                  ].join(' ')}
                >
                  <Sun className="size-6" />
                  <span className="text-xs font-semibold">{t('app.theme_light')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void changeTheme('dark')}
                  className={[
                    'flex flex-col items-center justify-center gap-2.5 rounded-2xl border p-4 text-center transition-all duration-150 active:scale-95',
                    theme === 'dark'
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-bold shadow-xs'
                      : 'border-[var(--line-subtle)] bg-[var(--surface-base)] text-[var(--text-secondary)] hover:border-[var(--line-strong)]',
                  ].join(' ')}
                >
                  <Moon className="size-6" />
                  <span className="text-xs font-semibold">{t('app.theme_dark')}</span>
                </button>
              </div>
            </Card>
          )}

          {/* 4. SUB-MENU: BAHASA */}
          {selectedMenu === 'language' && (
            <Card title="Bahasa Antarmuka" subtitle="Pilih bahasa yang digunakan di aplikasi">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {LANGUAGES.map((item) => {
                  const isSelected = lang === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void changeLang(item.id as LangCode)}
                      className={[
                        'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all active:scale-95',
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] font-bold text-[var(--accent)] shadow-2xs'
                          : 'border-[var(--line-subtle)] bg-[var(--surface-base)] text-[var(--text-secondary)] hover:border-[var(--line-strong)]',
                      ].join(' ')}
                    >
                      <span className="text-base" aria-hidden>
                        {item.flag}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </button>
                  )
                })}
              </div>
            </Card>
          )}

          {/* SUB-MENU: KELOLA DOMPET & AKUN */}
          {selectedMenu === 'wallets' && (
            <div className="space-y-4">
              <Card
                title="Daftar Dompet Transaksi"
                subtitle="Kelola dan atur urutan prioritas dompet yang muncul saat transaksi"
              >
                <div className="space-y-2.5">
                  {wallets.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)]/50">
                      <WalletIcon className="size-8 mx-auto text-[var(--text-muted)] mb-2" />
                      <p className="text-xs font-medium text-[var(--text-muted)]">
                        Belum ada dompet terdaftar. Tambahkan dompet baru pada formulir di bawah.
                      </p>
                    </div>
                  ) : (
                    wallets.map((wallet, idx) => {
                      const meta = getWalletTypeMeta(wallet.type)
                      return (
                        <div
                          key={wallet.id}
                          className={`flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all ${
                            wallet.isArchived
                              ? 'opacity-60 bg-[var(--surface-sunken)]/40 border-[var(--line-subtle)]'
                              : 'bg-[var(--surface-base)] border-[var(--line-subtle)] hover:border-[var(--line-strong)] shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                type="button"
                                title="Pindahkan ke atas"
                                disabled={idx === 0}
                                onClick={() => void moveWalletOrder(idx, 'up')}
                                className="grid size-5.5 place-items-center rounded-md bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
                              >
                                <ChevronUp className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Pindahkan ke bawah"
                                disabled={idx === wallets.length - 1}
                                onClick={() => void moveWalletOrder(idx, 'down')}
                                className="grid size-5.5 place-items-center rounded-md bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
                              >
                                <ChevronDown className="size-3.5" />
                              </button>
                            </div>

                            <div
                              className={`grid size-9 sm:size-10 place-items-center rounded-xl shrink-0 text-base shadow-2xs border ${meta.badgeClass}`}
                            >
                              {meta.icon}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                                  {wallet.name}
                                </span>
                                {wallet.isArchived && (
                                  <span className="rounded-md bg-[var(--surface-sunken)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] border border-[var(--line-subtle)]">
                                    Diarsipkan
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                                <span className="text-[var(--text-muted)] font-medium">
                                  {meta.label}
                                </span>
                                <span className="text-[var(--text-muted)]">•</span>
                                <span className="font-semibold text-[var(--accent)] tnum">
                                  {formatMoney(wallet.balance)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              title="Edit Dompet"
                              aria-label="Edit Dompet"
                              onClick={() => startEditWallet(wallet)}
                              className="grid size-8 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 hover:bg-sky-500/20 active:scale-95 transition-all cursor-pointer shadow-2xs"
                            >
                              <Pencil className="size-3.5" />
                            </button>

                            <button
                              type="button"
                              title={wallet.isArchived ? 'Aktifkan Kembali' : 'Arsipkan Dompet'}
                              aria-label={wallet.isArchived ? 'Aktifkan Kembali' : 'Arsipkan Dompet'}
                              onClick={() => void toggleArchiveWallet(wallet)}
                              className={`grid size-8 place-items-center rounded-xl border active:scale-95 transition-all cursor-pointer shadow-2xs ${
                                wallet.isArchived
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
                              }`}
                            >
                              {wallet.isArchived ? (
                                <ArchiveRestore className="size-3.5" />
                              ) : (
                                <Archive className="size-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              title="Hapus Dompet"
                              aria-label="Hapus Dompet"
                              onClick={() => void removeWallet(wallet)}
                              className="grid size-8 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer shadow-2xs"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </Card>

              <Card
                title={editingWallet ? `Edit Dompet: ${editingWallet.name}` : 'Tambah Dompet Baru'}
                subtitle={
                  editingWallet
                    ? 'Ubah nama atau jenis dompet ini'
                    : 'Tambahkan rekening bank, e-wallet, atau pos kas baru ke pembukuan'
                }
              >
                <div className="space-y-3.5">
                  {editingWallet && (
                    <div className="flex items-center justify-between rounded-xl bg-sky-500/10 border border-sky-500/20 px-3.5 py-2.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
                      <span>Sedang mengedit dompet: {editingWallet.name}</span>
                      <button
                        type="button"
                        onClick={cancelEditWallet}
                        className="underline hover:no-underline cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  )}

                  <Input
                    label="Nama Dompet"
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                    placeholder="Contoh: Bank BCA, GoPay Utama, Kas Harian"
                  />

                  <ModernSelect
                    label="Jenis Dompet"
                    value={walletType}
                    onChange={(val) => setWalletType(val as WalletType)}
                    options={WALLET_TYPE_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                      icon: <span className="text-sm">{opt.icon}</span>,
                    }))}
                    placeholder="Pilih Jenis Dompet"
                  />

                  {!editingWallet && (
                    <Input
                      label="Saldo Awal (Opsional)"
                      value={walletInitialBalance}
                      onChange={(e) => setWalletInitialBalance(e.target.value)}
                      placeholder="0"
                      inputMode="numeric"
                    />
                  )}

                  <div className="flex gap-2 pt-1">
                    {editingWallet ? (
                      <>
                        <Button loading={busy} onClick={() => void saveEditWallet()} className="flex-1">
                          <Check className="size-4" />
                          <span>Simpan Perubahan</span>
                        </Button>
                        <Button variant="secondary" onClick={cancelEditWallet}>
                          <span>Batal</span>
                        </Button>
                      </>
                    ) : (
                      <Button loading={busy} onClick={() => void addWallet()} className="w-full">
                        <Plus className="size-4" />
                        <span>Tambah Dompet</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* 5. SUB-MENU: KATEGORI & SUB-KATEGORI */}
          {selectedMenu === 'categories' && (
            <>
              <Card title="Kategori Utama" subtitle="Kelola kategori pemasukan dan pengeluaran">
                <div className="space-y-4">
                  {/* Filter Jenis: Pengeluaran vs Pemasukan */}
                  <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[var(--surface-sunken)] p-1">
                    {(['expense', 'income'] as CategoryKind[]).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setKind(value)}
                        className={[
                          'rounded-lg py-2 text-xs font-semibold transition-all active:scale-95',
                          kind === value
                            ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] font-bold shadow-2xs'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                        ].join(' ')}
                      >
                        {value === 'income' ? t('common.income') : t('common.expense')}
                      </button>
                    ))}
                  </div>

                  {/* Daftar Kategori */}
                  <div className="max-h-60 overflow-y-auto rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-base)] divide-y divide-[var(--line-subtle)]">
                    {visibleCategories.length === 0 ? (
                      <p className="p-4 text-center text-xs text-[var(--text-muted)]">
                        Belum ada kategori {kind === 'expense' ? 'pengeluaran' : 'pemasukan'}.
                      </p>
                    ) : (
                      visibleCategories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-[var(--surface-sunken)]/50"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Tag className="size-3.5 shrink-0 text-[var(--text-muted)]" />
                            <span className="truncate text-xs font-medium text-[var(--text-primary)]">
                              {category.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            aria-label={t('common.delete')}
                            onClick={() => void removeCategory(category)}
                            className="grid size-7 place-items-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--negative-soft)] hover:text-[var(--negative)] active:scale-95"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Form Tambah Kategori */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder={`Tambah kategori ${kind === 'expense' ? 'pengeluaran' : 'pemasukan'} baru...`}
                      className="flex-1 rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-base)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    />
                    <Button loading={busy} onClick={() => void addCategory()}>
                      <Plus className="size-4" />
                      <span>{t('common.add')}</span>
                    </Button>
                  </div>
                </div>
              </Card>

              <Card
                title="Sub-Kategori"
                subtitle="Atur sub-kategori spesifik di bawah kategori induk"
              >
                <div className="space-y-4">
                  <ModernSelect
                    label="Pilih Kategori Induk"
                    value={subParent}
                    onChange={(val) => setSubParent(val)}
                    options={categories.map((c) => ({
                      value: c.id,
                      label: `${c.name} (${c.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'})`,
                      icon: <Tag className="size-4 text-[var(--accent)]" />,
                    }))}
                    placeholder="Pilih Kategori Induk"
                  />

                  {subParent ? (
                    <>
                      <div className="max-h-52 overflow-y-auto rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-base)] divide-y divide-[var(--line-subtle)]">
                        {visibleSubs.length === 0 ? (
                          <p className="p-4 text-center text-xs text-[var(--text-muted)]">
                            Belum ada sub-kategori untuk kategori ini.
                          </p>
                        ) : (
                          visibleSubs.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-[var(--surface-sunken)]/50"
                            >
                              <span className="truncate text-xs font-medium text-[var(--text-primary)]">
                                {sub.name}
                              </span>
                              <button
                                type="button"
                                aria-label={t('common.delete')}
                                onClick={() =>
                                  void run(async () => {
                                    await SubCategoryRepo.remove(sub.id)
                                    await load()
                                  }, 'Sub-kategori berhasil dihapus')
                                }
                                className="grid size-7 place-items-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--negative-soft)] hover:text-[var(--negative)] active:scale-95"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSub}
                          onChange={(e) => setNewSub(e.target.value)}
                          placeholder="Nama sub-kategori baru..."
                          className="flex-1 rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-base)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                        />
                        <Button loading={busy} onClick={() => void addSubCategory()}>
                          <Plus className="size-4" />
                          <span>{t('common.add')}</span>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)]">
                      Pilih salah satu kategori induk di atas untuk melihat dan menambah sub-kategori.
                    </p>
                  )}
                </div>
              </Card>
            </>
          )}

          {/* 6. SUB-MENU: CADANGAN & DATA */}
          {selectedMenu === 'backup' && (
            <Card
              title={t('settings.group_data')}
              subtitle={t('settings.backup_desc')}
            >
              <div className="space-y-3">
                <Button
                  variant="secondary"
                  block
                  onClick={() => void api.download(ApiPaths.exportAll, 'sintya-backup.json')}
                >
                  <Download className="size-4" aria-hidden />
                  <span>{t('settings.backup_title')}</span>
                </Button>

                <label className="block">
                  <span className="sr-only">{t('settings.restore_title')}</span>
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ''
                      if (file) void restore(file)
                    }}
                  />
                  <span className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-base)] text-sm font-medium transition-colors hover:border-[var(--line-strong)] active:scale-95">
                    <Upload className="size-4" aria-hidden />
                    <span>{t('settings.restore_title')}</span>
                  </span>
                </label>
              </div>
            </Card>
          )}

          {/* 7. SUB-MENU: INFORMASI APLIKASI */}
          {selectedMenu === 'about' && (
            <Card title="Informasi Sistem & Keamanan">
              <div className="space-y-2.5 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center justify-between py-1 border-b border-[var(--line-subtle)]">
                  <span>Versi Aplikasi</span>
                  <span className="font-semibold text-[var(--text-primary)]">v1.0.0 (Production)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--line-subtle)]">
                  <span>Penyimpanan Backend</span>
                  <span className="font-semibold text-[var(--text-primary)]">PocketBase & SQLite</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--line-subtle)]">
                  <span>Enkripsi Sesi</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[var(--accent)]">
                    <ShieldCheck className="size-3.5" />
                    <span>Terenkripsi</span>
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>Tipe Aplikasi</span>
                  <span className="font-semibold text-[var(--text-primary)]">PWA / Web App Standalone</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}