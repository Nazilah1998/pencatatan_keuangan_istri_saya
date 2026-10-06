import { atom } from 'nanostores'

export type ConfirmOptions = {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export type ConfirmState = ConfirmOptions & {
  isOpen: boolean
  resolve?: (value: boolean) => void
}

export const $confirmState = atom<ConfirmState>({
  isOpen: false,
})

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    $confirmState.set({
      isOpen: true,
      title: options.title ?? 'Konfirmasi Tindakan',
      message: options.message ?? 'Tindakan ini tidak dapat dibatalkan.',
      confirmText: options.confirmText ?? 'Lanjutkan',
      cancelText: options.cancelText ?? 'Batal',
      variant: options.variant ?? 'danger',
      resolve,
    })
  })
}

export function confirmDelete(title?: string, message?: string): Promise<boolean> {
  return confirmAction({
    title: title ?? 'Hapus Data?',
    message: message ?? 'Tindakan ini tidak dapat dibatalkan dan data akan dihapus secara permanen.',
    confirmText: 'Hapus',
    cancelText: 'Batal',
    variant: 'danger',
  })
}

export function resolveConfirm(value: boolean) {
  const current = $confirmState.get()
  if (current.resolve) {
    current.resolve(value)
  }
  $confirmState.set({
    isOpen: false,
    resolve: undefined,
  })
}
