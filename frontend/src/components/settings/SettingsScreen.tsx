import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Database,
  Download,
  Globe,
  Info,
  LogOut,
  Moon,
  Palette,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Tag,
  Trash2,
  Upload,
  User,
} from 'lucide-react'

import { api, ApiError, ApiPaths } from '../../lib/api/client'
import type { PinStatus } from '../../lib/api/types'
import {
  CategoryRepo,
  HouseholdRepo,
  SubCategoryRepo,
  UserRepo,
  type Category,
  type SubCategory,
} from '../../lib/api/repositories'
import { LANGUAGES } from '../../lib/i18n'
import type { LangCode } from '../../lib/i18n'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Field'
import { ModernSelect } from '../ui/ModernSelect'

type CategoryKind = 'income' | 'expense'
type SettingSubMenu =
  | 'profile'
  | 'pin'
  | 'theme'
  | 'language'
  | 'categories'
  | 'backup'
  | 'about'

export function SettingsScreen() {
  const { t, m, lang, setLang, theme, setTheme, signOut, isAuthed } = useApp()

  const [selectedMenu, setSelectedMenu] = useState<SettingSubMenu | null>(null)

  const [householdName, setHouseholdName] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [subs, setSubs] = useState<SubCategory[]>([])
  const [kind, setKind] = useState<CategoryKind>('expense')
  const [newCategory, setNewCategory] = useState('')
  const [newSub, setNewSub] = useState('')
  const [subParent, setSubParent] = useState('')

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
      const [household, list, subList, pinStatus] = await Promise.all([
        HouseholdRepo.current().catch(() => null),
        CategoryRepo.list(),
        SubCategoryRepo.list(),
        api.get<PinStatus>(ApiPaths.pinStatus).catch(() => null),
      ])

      if (household) setHouseholdName(household.name)
      setCategories(list)
      setSubs(subList)
      setPin(pinStatus)
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
      await UserRepo.updateProfile({ name: householdName.trim() }).catch(() => null)
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
    if (!window.confirm(t('common.delete_confirm_desc'))) return

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

    if (!window.confirm('Hapus proteksi PIN keamanan dari aplikasi?')) return

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
        <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--negative)]/20 bg-[var(--negative-soft)] p-3.5 text-xs font-semibold text-[var(--negative)] animate-in fade-in duration-200">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {notice && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-3.5 text-xs font-semibold text-[var(--accent)] animate-in fade-in duration-200">
          <Check className="size-4 shrink-0 stroke-[2.5]" />
          <span className="flex-1">{notice}</span>
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
                onClick={() => {
                  if (window.confirm(m('auth.signOut'))) signOut()
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