/**
 * Form masuk dan daftar.
 *
 * Operation PocketBase dipanggil lewat `lib/pb/auth`; hook `OnRecordAfterCreate`
 * di backend yang membuat household, menyemai kategori, dan membuat dompet
 * bawaan. Komponen ini tidak boleh memuat logika bisnis apa pun.
 */
import { useState, type ChangeEvent, type SyntheticEvent } from 'react'

import { api, ApiPaths, ApiError } from '../../lib/api/client'
import { AuthStore } from '../../lib/pb/authStore'
import { login, oauthRedirectUrl, register } from '../../lib/pb/auth'
import { useApp } from '../providers/useApp'
import type { TranslateMessage } from '../../lib/utils/messages'
import { AuthCard } from '../ui/AuthCard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Field'

type Mode = 'login' | 'register'

export function AuthForm({ mode }: { mode: Mode }) {
  const { t, m } = useApp()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [household, setHousehold] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isRegister = mode === 'register'

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      const auth = isRegister
        ? await register({
            email,
            password,
            name,
            householdName: household,
          })
        : await login(email, password)

      const me = await api
        .get<{ household_id?: string; base_currency?: string; language?: string }>(ApiPaths.me)
        .catch(() => null)

      const session = AuthStore.get()
      if (session && me?.household_id && me.household_id !== session.householdId) {
        AuthStore.adopt({ ...session, householdId: me.household_id }, auth.token)
      }

      const next = new URLSearchParams(window.location.search).get('next')
      window.location.replace(next && next.startsWith('/') ? next : '/')
    } catch (err) {
      setError(describeError(err, m))
      setBusy(false)
    }
  }

  const oauthUrl = oauthRedirectUrl()

  return (
    <AuthCard
      title={isRegister ? t('auth.create_account') : t('auth.welcome_back')}
      subtitle={t('app.tagline')}
      footer={
        <p className="text-center text-sm text-[var(--text-muted)]">
          {isRegister ? t('auth.have_account') : t('auth.no_account')}{' '}
          <a
            href={isRegister ? '/masuk' : '/daftar'}
            className="font-medium text-[var(--accent)] hover:underline"
          >
            {isRegister ? t('auth.sign_in') : t('auth.register')}
          </a>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3.5">
        {isRegister && (
          <>
            <Input
              label={t('auth.name')}
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.currentTarget.value)}
              autoComplete="name"
              required
            />
            <Input
              label={t('auth.household')}
              value={household}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setHousehold(e.currentTarget.value)}
              placeholder="Keluarga Sintya"
              required
            />
          </>
        )}

        <Input
          label={t('auth.email')}
          type="email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.currentTarget.value)}
          autoComplete="email"
          inputMode="email"
          required
        />

        <Input
          label={t('auth.password')}
          type="password"
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.currentTarget.value)}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          minLength={8}
          required
        />

        {error && (
          <p role="alert" className="text-sm text-[var(--negative)]">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" block loading={busy}>
          {isRegister ? t('auth.register') : t('auth.sign_in')}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">
        <span className="h-px flex-1 bg-[var(--line-subtle)]" />
        <span>atau</span>
        <span className="h-px flex-1 bg-[var(--line-subtle)]" />
      </div>

      <a href={oauthUrl} className="block">
        <Button variant="secondary" size="lg" block>
          {t('auth.continue_with_google')}
        </Button>
      </a>
    </AuthCard>
  )
}

function describeError(err: unknown, m: TranslateMessage): string {
  const status = err instanceof ApiError ? err.status : (err as { status?: number } | null)?.status
  const detail = err instanceof Error ? err.message : ''

  if (status === 400 || /invalid credentials|failed to authenticate/i.test(detail)) {
    return m('auth.invalidCredentials')
  }
  if (status === 0 || /fetch failed|networkerror|load failed/i.test(detail)) {
    return m('auth.networkError')
  }

  return detail || m('common.retry')
}