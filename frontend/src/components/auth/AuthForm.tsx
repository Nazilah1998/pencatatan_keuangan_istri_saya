/**
 * Form masuk dan daftar.
 *
 * Operation PocketBase dipanggil lewat `lib/pb/auth`; hook `OnRecordAfterCreate`
 * di backend yang membuat household, menyemai kategori, dan membuat dompet
 * bawaan. Komponen ini tidak boleh memuat logika bisnis apa pun.
 */
import { useState, type ChangeEvent, type SyntheticEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { api, ApiPaths, ApiError } from '../../lib/api/client'
import { AuthStore } from '../../lib/pb/authStore'
import { login, loginWithGoogle, register } from '../../lib/pb/auth'
import { useApp } from '../providers/useApp'
import type { TranslateMessage } from '../../lib/utils/messages'
import { AuthCard } from '../ui/AuthCard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Field'

type Mode = 'login' | 'register'

function GoogleIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

export function AuthForm({ mode }: { mode: Mode }) {
  const { t, m } = useApp()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [household, setHousehold] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

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

  async function handleGoogleLogin() {
    setError('')
    setGoogleBusy(true)

    try {
      const auth = await loginWithGoogle()

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
      setGoogleBusy(false)
    }
  }

  return (
    <AuthCard
      title={isRegister ? t('auth.create_account') : t('auth.welcome_back')}
      subtitle={t('app.tagline')}
      footer={
        <p className="text-center text-sm text-[var(--text-muted)]">
          {isRegister ? t('auth.have_account') : t('auth.no_account')}{' '}
          <a
            href={isRegister ? '/masuk' : '/daftar'}
            className="font-semibold text-[var(--accent)] hover:underline"
          >
            {isRegister ? t('auth.sign_in') : t('auth.register')}
          </a>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
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
          placeholder="nama@email.com"
          required
        />

        <Input
          label={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.currentTarget.value)}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          minLength={8}
          placeholder="Minimal 8 karakter"
          required
          rightSlot={
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              className="grid size-8 place-items-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-overlay)] hover:text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="size-4.5" aria-hidden />
              ) : (
                <Eye className="size-4.5" aria-hidden />
              )}
            </button>
          }
        />

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-[var(--negative)]/30 bg-[var(--negative-soft)] p-3.5 text-xs sm:text-sm text-[var(--negative)]"
          >
            <span className="font-medium">{error}</span>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          block
          loading={busy}
          disabled={googleBusy}
          className="h-12 rounded-xl font-semibold shadow-md hover:shadow-[0_4px_20px_var(--accent-soft)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 cursor-pointer"
        >
          {isRegister ? t('auth.register') : t('auth.sign_in')}
        </Button>
      </form>

      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--line-subtle)]" />
        </div>
        <div className="relative bg-[var(--surface-raised)] px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          atau
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleBusy || busy}
        className="group relative flex w-full h-12 items-center justify-center gap-3 rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-overlay)]/30 hover:bg-[var(--surface-overlay)] hover:border-[var(--line-strong)] text-[var(--text-primary)] font-medium text-sm sm:text-base shadow-xs hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] active:scale-[0.99] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        <span className="grid size-7 place-items-center rounded-lg bg-[var(--surface-raised)] border border-[var(--line-subtle)]/70 shadow-xs transition-transform duration-200 group-hover:scale-105">
          <GoogleIcon className="size-4.5" />
        </span>
        <span>{googleBusy ? 'Menghubungkan ke Google...' : t('auth.continue_with_google')}</span>
      </button>
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