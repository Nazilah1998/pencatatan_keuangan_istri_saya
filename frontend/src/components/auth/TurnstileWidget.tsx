import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { PUBLIC_TURNSTILE_SITE_KEY } from '../../lib/config/public'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string
          action?: string
          callback?: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'flexible' | 'compact'
        }
      ) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export type TurnstileWidgetHandle = {
  reset: () => void
}

type Props = {
  action: 'login' | 'signup'
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, Props>(function TurnstileWidget(
  { action, onVerify, onError, onExpire },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const isRenderedRef = useRef(false)
  const lastResetTimeRef = useRef(0)

  const onVerifyRef = useRef(onVerify)
  onVerifyRef.current = onVerify
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useImperativeHandle(ref, () => ({
    reset: () => {
      const now = Date.now()
      if (now - lastResetTimeRef.current < 800) {
        return
      }
      lastResetTimeRef.current = now

      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current)
        } catch {
          void 0
        }
      }
    },
  }))

  useEffect(() => {
    if (!PUBLIC_TURNSTILE_SITE_KEY) return

    let cancelled = false

    function renderWidget() {
      if (cancelled || !containerRef.current || !window.turnstile) return
      if (isRenderedRef.current && widgetIdRef.current) return

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: PUBLIC_TURNSTILE_SITE_KEY,
          action,
          theme: 'auto',
          size: 'flexible',
          callback: (token: string) => {
            if (!cancelled) onVerifyRef.current(token)
          },
          'error-callback': () => {
            if (!cancelled && onErrorRef.current) onErrorRef.current()
          },
          'expired-callback': () => {
            if (!cancelled && onExpireRef.current) onExpireRef.current()
          },
        })
        widgetIdRef.current = id
        isRenderedRef.current = true
      } catch {
        void 0
      }
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      const existingScript = document.querySelector('script[src*="turnstile/v0/api.js"]')
      if (!existingScript) {
        const script = document.createElement('script')
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        script.async = true
        script.defer = true
        script.onload = () => renderWidget()
        document.head.appendChild(script)
      } else {
        const timer = setInterval(() => {
          if (window.turnstile) {
            clearInterval(timer)
            renderWidget()
          }
        }, 80)
        return () => clearInterval(timer)
      }
    }

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          void 0
        }
        widgetIdRef.current = null
        isRenderedRef.current = false
      }
    }
  }, [action])

  if (!PUBLIC_TURNSTILE_SITE_KEY) return null

  return (
    <div className="w-full my-2 sm:my-3 min-h-[65px] flex items-center justify-center transition-all">
      <div
        ref={containerRef}
        className="w-full [&>iframe]:!w-full [&>iframe]:!min-w-full [&>div]:!w-full"
        style={{ width: '100%' }}
      />
    </div>
  )
})
