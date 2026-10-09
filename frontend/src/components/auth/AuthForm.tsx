/**
 * Form masuk dan daftar.
 *
 * Operation PocketBase dipanggil lewat `lib/pb/auth`; hook `OnRecordAfterCreate`
 * di backend yang membuat household, menyemai kategori, dan membuat dompet
 * bawaan. Komponen ini tidak boleh memuat logika bisnis apa pun.
 */
import { useState, useRef, useCallback, type ChangeEvent, type SyntheticEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { api, ApiPaths, ApiError } from '../../lib/api/client'
import { AuthStore } from '../../lib/pb/authStore'
import { login, register } from '../../lib/pb/auth'
import { PUBLIC_TURNSTILE_SITE_KEY } from '../../lib/config/public'
import { TurnstileWidget, type TurnstileWidgetHandle } from './TurnstileWidget'
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
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const isRegister = mode === 'register'

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token)
    setError('')
  }, [])

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken('')
    setError('Verifikasi keamanan Turnstile gagal dimuat. Coba refresh halaman.')
  }, [])

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }, [])

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setError('Silakan selesaikan verifikasi keamanan Turnstile terlebih dahulu.')
      return
    }

    setBusy(true)

    try {
      if (PUBLIC_TURNSTILE_SITE_KEY && turnstileToken) {
        try {
          await api.post(ApiPaths.turnstileVerify, {
            token: turnstileToken,
            action: isRegister ? 'signup' : 'login',
          })
        } catch (turnstileErr) {
          if (!(turnstileErr instanceof ApiError && turnstileErr.status === 404)) {
            throw turnstileErr
          }
        }
      }

      const auth = isRegister
        ? await register({
            email,
            password,
            name,
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
      setTurnstileToken('')
      turnstileRef.current?.reset()
    }
  }

  return (
    <AuthCard
      title={isRegister ? t('auth.create_account') : t('auth.welcome_back')}
      subtitle={t('app.tagline')}
    >
      <form onSubmit={onSubmit} className="space-y-3.5 sm:space-y-4">
        {isRegister && (
          <Input
            label={t('auth.name')}
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.currentTarget.value)}
            autoComplete="name"
            placeholder="Nama Anda"
            required
          />
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

        {PUBLIC_TURNSTILE_SITE_KEY && (
          <TurnstileWidget
            ref={turnstileRef}
            action={isRegister ? 'signup' : 'login'}
            onVerify={handleTurnstileVerify}
            onError={handleTurnstileError}
            onExpire={handleTurnstileExpire}
          />
        )}

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
          disabled={Boolean(PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken)}
          className="h-11 sm:h-12 rounded-xl font-semibold shadow-md hover:shadow-[0_4px_20px_var(--accent-soft)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 cursor-pointer"
        >
          {isRegister ? t('auth.register') : t('auth.sign_in')}
        </Button>
      </form>
    </AuthCard>
  )
}

function describeError(err: unknown, m: TranslateMessage): string {
  const status = err instanceof ApiError ? err.status : (err as { status?: number } | null)?.status
  const detail = err instanceof Error ? err.message : ''

  if (status === 400 || /invalid credentials|failed to authenticate/i.test(detail)) {
    return m('auth.invalidCredentials')
  }
  if (status === 429) {
    return 'Terlalu banyak percobaan masuk. Silakan tunggu beberapa saat.'
  }
  if (status === 0 || /fetch failed|networkerror|load failed/i.test(detail)) {
    return m('auth.networkError')
  }

  return detail || m('common.retry')
}