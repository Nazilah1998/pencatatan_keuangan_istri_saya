import { useState } from 'react'
import { Plus } from 'lucide-react'

import { useApp } from '../providers/useApp'
import { Modal } from '../ui/Modal'
import { TransactionForm } from '../transactions/TransactionForm'
import { usePathname } from './nav'

export function TransactionFAB() {
  const { t } = useApp()
  const path = usePathname()
  const [open, setOpen] = useState(false)

  if (path === '/pengaturan' || path.startsWith('/pengaturan/')) {
    return null
  }

  function handleDone() {
    setOpen(false)
    window.dispatchEvent(new CustomEvent('tx:created'))
  }

  return (
    <>
      <button
        type="button"
        data-fab="true"
        onClick={() => setOpen(true)}
        aria-label={t('transactions.form.add_title')}
        className="print-hidden fixed right-4 bottom-24 z-40 flex size-13 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--text-inverted)] shadow-lg shadow-[var(--accent)]/30 transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 sm:right-6 lg:right-8 lg:bottom-8 lg:size-14"
      >
        <Plus className="size-6 shrink-0 transition-transform duration-200 group-hover:rotate-90" aria-hidden />
        <span className="sr-only">{t('transactions.form.add_title')}</span>
      </button>

      <Modal
        open={open}
        title={t('transactions.form.add_title')}
        onClose={() => setOpen(false)}
      >
        <TransactionForm
          editing={null}
          defaultType="expense"
          onDone={handleDone}
        />
      </Modal>
    </>
  )
}
