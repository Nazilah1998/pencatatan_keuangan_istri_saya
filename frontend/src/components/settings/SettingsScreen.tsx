/**
 * Pengaturan: profil, tampilan, bahasa, PIN, dan pengelolaan data.
 *
 * Kategori dan dompet dikelola di sini karena keduanya master data yang
 * dipakai lintas layar. Ekspor/pulihkan data ditangani backend Go Fiber lewat
 * `ApiPaths`, bukan dengan membaca koleksi satu per satu dari klien.
 */
import { useCallback, useEffect, useState } from 'react'
import { Download, LogOut, Moon, Sun, Trash2, Upload } from 'lucide-react'

import { api, ApiError, ApiPaths } from '../../lib/api/client'
import type { PinStatus } from '../../lib/api/types'
import {
  CategoryRepo,
  HouseholdRepo,
  SubCategoryRepo,
  type Category,
  type SubCategory,
} from '../../lib/api/repositories'
import { LANGUAGES } from '../../lib/i18n'
import type { LangCode } from '../../lib/i18n'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input, Select } from '../ui/Field'

type CategoryKind = 'income' | 'expense'

export function SettingsScreen() {
  const { t, m, lang, setLang, theme, setTheme, signOut, isAuthed } = useApp()

  const [householdName, setHouseholdName] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [subs, setSubs] = useState<SubCategory[]>([])
  const [kind, setKind] = useState<CategoryKind>('expense')
  const [newCategory, setNewCategory] = useState('')
  const [newSub, setNewSub] = useState('')
  const [subParent, setSubParent] = useState('')

  const [pin, setPin] = useState<PinStatus | null>(null)
  const [pinInput, setPinInput] = useState('')
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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
    }
  }, [m])

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
    }, m('common.saved'))
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
    })
  }

  async function removeCategory(category: Category) {
    if (!window.confirm(t('common.delete_confirm_desc'))) return

    await run(async () => {
      await CategoryRepo.remove(category.id)
      await load()
    })
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
    })
  }

  async function savePin() {
    if (pinInput.length < 4) {
      setError(m('pin.minLength'))
      return
    }

    setPinBusy(true)
    setError('')

    try {
      const updated = await api.post<PinStatus>(ApiPaths.pinSet, {
        pin: pinInput,
        old_pin: pin?.hasPin ? pinOld : '',
      })
      setPin(updated)
      setPinInput('')
      setPinOld('')
      setNotice(m('common.saved'))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
    } finally {
      setPinBusy(false)
    }
  }

  async function restore(file: File) {
    await run(async () => {
      const payload = JSON.parse(await file.text()) as unknown
      await api.post(ApiPaths.restore, payload)
      await load()
    }, m('common.saved'))
  }

  return (
    <div className="space-y-4">
      {error && (
        <Card>
          <p className="text-sm text-[var(--negative)]">{error}</p>
        </Card>
      )}

      {notice && (
        <Card>
          <p className="text-sm text-[var(--accent)]">{notice}</p>
        </Card>
      )}

      <Card title={t('settings.group_profile')}>
        <div className="space-y-3">
          <Input
            label={t('auth.household')}
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
          />
          <Button loading={busy} onClick={() => void saveHousehold()}>
            {t('common.save')}
          </Button>
        </div>
      </Card>

      <Card title={t('settings.theme_title')} subtitle={t('settings.theme_desc')}>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={theme === 'dark' ? 'primary' : 'secondary'}
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme('dark')}
          >
            <Moon className="size-4" aria-hidden />
            {t('app.theme_dark')}
          </Button>
          <Button
            variant={theme === 'light' ? 'primary' : 'secondary'}
            aria-pressed={theme === 'light'}
            onClick={() => setTheme('light')}
          >
            <Sun className="size-4" aria-hidden />
            {t('app.theme_light')}
          </Button>
        </div>
      </Card>

      <Card title={t('settings.lang_title')} subtitle={t('settings.lang_desc')}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LANGUAGES.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={lang === item.id ? 'primary' : 'secondary'}
              aria-pressed={lang === item.id}
              onClick={() => void setLang(item.id as LangCode)}
            >
              <span aria-hidden>{item.flag}</span>
              {item.name}
            </Button>
          ))}
        </div>
      </Card>

      <Card title={t('settings.cat_title')} subtitle={t('settings.cat_desc')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['expense', 'income'] as CategoryKind[]).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={kind === value ? 'primary' : 'secondary'}
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
              >
                {value === 'income' ? t('common.income') : t('common.expense')}
              </Button>
            ))}
          </div>

          <ul className="divide-y divide-[var(--line-subtle)]">
            {visibleCategories.map((category) => (
              <li key={category.id} className="flex items-center justify-between gap-3 py-2">
                <span className="truncate text-sm">{category.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t('common.delete')}
                  onClick={() => void removeCategory(category)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>

          <Input
            label={t('settings.cat_title')}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder={t('category.nameRequired')}
          />
          <Button loading={busy} onClick={() => void addCategory()}>
            {t('common.add')}
          </Button>
        </div>
      </Card>

      <Card title={t('transactions.form.select_subcategory')} subtitle={t('settings.cat_desc')}>
        <div className="space-y-4">
          <Select
            label={t('transactions.form.select_category')}
            value={subParent}
            onChange={(e) => setSubParent(e.target.value)}
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <ul className="divide-y divide-[var(--line-subtle)]">
            {visibleSubs.map((sub) => (
              <li key={sub.id} className="flex items-center justify-between gap-3 py-2">
                <span className="truncate text-sm">{sub.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t('common.delete')}
                  onClick={() =>
                    void run(async () => {
                      await SubCategoryRepo.remove(sub.id)
                      await load()
                    })
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>

          <Input
            label={t('transactions.form.select_subcategory')}
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
          />
          <Button loading={busy} disabled={!subParent} onClick={() => void addSubCategory()}>
            {t('common.add')}
          </Button>
        </div>
      </Card>

      <Card title={t('auth.password')} subtitle={m('pin.notSet')}>
        <div className="space-y-3">
          {pin?.hasPin && (
            <Input
              label={m('pin.needOld')}
              type="password"
              inputMode="numeric"
              value={pinOld}
              onChange={(e) => setPinOld(e.target.value)}
            />
          )}

          <Input
            label={t('auth.password')}
            type="password"
            inputMode="numeric"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            hint={m('pin.minLength')}
          />

          <Button loading={pinBusy} onClick={() => void savePin()}>
            {t('common.save')}
          </Button>
        </div>
      </Card>

      <Card title={t('settings.group_data')} subtitle={t('settings.backup_desc')}>
        <div className="space-y-2">
          <Button
            variant="secondary"
            block
            onClick={() => void api.download(ApiPaths.exportAll, 'sintya-backup.json')}
          >
            <Download className="size-4" aria-hidden />
            {t('settings.backup_title')}
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
            <span className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[0.75rem] border border-[var(--line-subtle)] bg-[var(--surface-overlay)] text-sm font-medium transition-colors hover:border-[var(--line-strong)]">
              <Upload className="size-4" aria-hidden />
              {t('settings.restore_title')}
            </span>
          </label>
        </div>
      </Card>

      <Card title={t('settings.group_app')} subtitle={t('settings.install_desc')}>
        <div className="space-y-2">
          {isAuthed && (
            <Button
              variant="danger"
              block
              onClick={() => {
                if (window.confirm(m('auth.signOut'))) signOut()
              }}
            >
              <LogOut className="size-4" aria-hidden />
              {t('auth.sign_out')}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}