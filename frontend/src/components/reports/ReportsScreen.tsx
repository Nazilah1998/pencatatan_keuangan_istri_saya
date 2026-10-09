import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Printer,
  Scale,
  TrendingDown,
  Wallet as WalletIcon,
} from 'lucide-react'

import { api, ApiError, ApiPaths } from '../../lib/api/client'
import type { Cashflow } from '../../lib/api/types'
import {
  CategoryRepo,
  TxRepo,
  WalletRepo,
  type Category,
  type Transaction,
  type Wallet,
} from '../../lib/api/repositories'
import { formatMoney } from '../../lib/utils/currency'
import {
  currentMonth,
  formatMonth,
  monthRange,
  shiftMonth,
} from '../../lib/utils/date'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card, EmptyState, Skeleton, StatTile } from '../ui/Card'

type Range = 'monthly' | 'yearly'
type JournalFilter = 'all' | 'expense' | 'income' | 'transfer'

export function ReportsScreen() {
  const { t, m, session, isAuthed, ready } = useApp()
  const currency = session?.baseCurrency === 'USD' ? 'USD' : 'IDR'

  const [range, setRange] = useState<Range>('monthly')
  const [anchor, setAnchor] = useState(currentMonth())
  const [selectedYear, setSelectedYear] = useState(() => currentMonth().slice(0, 4))
  const [journalFilter, setJournalFilter] = useState<JournalFilter>('all')

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [apiCashflow, setApiCashflow] = useState<Cashflow | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const curMonth = currentMonth()
  const curYear = curMonth.slice(0, 4)
  const isCurrentPeriod = range === 'monthly' ? anchor === curMonth : selectedYear === curYear

  const load = useCallback(async () => {
    if (!ready || !isAuthed) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')

    try {
      const catPromise = CategoryRepo.list().catch(() => [])
      const walPromise = WalletRepo.list(true).catch(() => [])

      if (range === 'monthly') {
        const { start, end } = monthRange(anchor)
        const [cRes, txList, catList, walList] = await Promise.all([
          api.get<Cashflow>(ApiPaths.cashflow(start, end)).catch(() => null),
          TxRepo.listByMonth(anchor).catch(() => []),
          catPromise,
          walPromise,
        ])

        setApiCashflow(cRes)
        setTransactions(txList)
        setCategories(catList)
        setWallets(walList)
      } else {
        const start = `${selectedYear}-01-01`
        const end = `${selectedYear}-12-31`
        const [cRes, txList, catList, walList] = await Promise.all([
          api.get<Cashflow>(ApiPaths.cashflow(start, end)).catch(() => null),
          TxRepo.listRange(start, end).catch(() => []),
          catPromise,
          walPromise,
        ])

        setApiCashflow(cRes)
        setTransactions(txList)
        setCategories(catList)
        setWallets(walList)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
    } finally {
      setLoading(false)
    }
  }, [anchor, isAuthed, m, range, ready, selectedYear])

  useEffect(() => {
    if (!ready || !isAuthed) return
    void load()

    const onTxChange = () => {
      void load()
    }
    window.addEventListener('tx:created', onTxChange)
    window.addEventListener('category:updated', onTxChange)
    return () => {
      window.removeEventListener('tx:created', onTxChange)
      window.removeEventListener('category:updated', onTxChange)
    }
  }, [isAuthed, load, ready])

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]))
  }, [categories])

  const walletMap = useMemo(() => {
    return new Map(wallets.map((w) => [w.id, w.name]))
  }, [wallets])

  const income = useMemo(() => {
    const fromTx = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    return fromTx > 0 ? fromTx : (apiCashflow?.income ?? 0)
  }, [transactions, apiCashflow])

  const expense = useMemo(() => {
    const fromTx = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    return fromTx > 0 ? fromTx : (apiCashflow?.expense ?? 0)
  }, [transactions, apiCashflow])

  const transferTotal = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'transfer')
      .reduce((sum, t) => sum + t.amount, 0)
  }, [transactions])

  const surplus = income - expense
  const savingRate = income > 0 ? Math.round((surplus / income) * 100) : 0

  const daysInMonth = useMemo(() => {
    const [y, mNum] = anchor.split('-').map(Number)
    return new Date(y || 2026, mNum || 10, 0).getDate()
  }, [anchor])

  const avgExpense = useMemo(() => {
    if (range === 'monthly') {
      return daysInMonth > 0 ? Math.round(expense / daysInMonth) : 0
    }
    return Math.round(expense / 12)
  }, [daysInMonth, expense, range])

  const walletLedgers = useMemo(() => {
    return wallets.map((w) => {
      const inTx = transactions
        .filter((t) => t.wallet === w.id && t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      const outTx = transactions
        .filter((t) => t.wallet === w.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      const trfOut = transactions
        .filter((t) => t.wallet === w.id && t.type === 'transfer')
        .reduce((sum, t) => sum + t.amount, 0)
      const trfIn = transactions
        .filter((t) => t.toWallet === w.id && t.type === 'transfer')
        .reduce((sum, t) => sum + t.amount, 0)

      const totalIn = inTx + trfIn
      const totalOut = outTx + trfOut
      const net = totalIn - totalOut

      return {
        wallet: w,
        totalIn,
        totalOut,
        net,
      }
    }).filter((item) => item.totalIn > 0 || item.totalOut > 0 || item.wallet.balance > 0)
  }, [wallets, transactions])

  const filteredTransactions = useMemo(() => {
    if (journalFilter === 'all') return transactions
    return transactions.filter((t) => t.type === journalFilter)
  }, [transactions, journalFilter])

  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
  }, [filteredTransactions])

  function handlePrintPdf() {
    window.print()
  }

  function exportCSV() {
    if (transactions.length === 0) {
      setError('Belum ada transaksi untuk diekspor pada periode ini.')
      return
    }

    const header = ['No', 'Tanggal', 'Tipe', 'Kategori', 'Sumber Akun', 'Tujuan Akun', 'Nominal', 'Catatan']
    const rows = transactions.map((t, idx) => [
      idx + 1,
      `"${t.date.slice(0, 10)}"`,
      `"${t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer'}"`,
      `"${categoryMap.get(t.category)?.name || t.category || 'Tanpa Kategori'}"`,
      `"${walletMap.get(t.wallet) || '-'}"`,
      `"${walletMap.get(t.toWallet) || '-'}"`,
      t.amount,
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `laporan-keuangan-${range === 'monthly' ? anchor : selectedYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const periodTitle = range === 'monthly' ? formatMonth(anchor) : `Tahun ${selectedYear}`

  return (
    <div className="space-y-5">
      {/* 1. KONTROL DAN ALAT EKSPOR (Sembunyi saat dicetak) */}
      <div className="print-hidden space-y-3">
        {/* Switcher Mode Laporan */}
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[var(--surface-sunken)] p-1.5 shadow-2xs">
          {(['monthly', 'yearly'] as Range[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={[
                'rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer',
                range === key
                  ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] font-bold shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              {key === 'monthly' ? t('reports.monthly_report') : t('reports.yearly_report')}
            </button>
          ))}
        </div>

        {/* Navigator Periode */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] px-4 py-2.5 shadow-xs">
          <button
            type="button"
            aria-label={t('common.prev')}
            onClick={() => {
              if (range === 'monthly') {
                setAnchor(shiftMonth(anchor, -1))
              } else {
                setSelectedYear(String(parseInt(selectedYear, 10) - 1))
              }
            }}
            className="grid size-8 place-items-center rounded-lg border border-[var(--line-subtle)] text-[var(--text-secondary)] transition-all hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="size-4.5" />
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-[var(--accent)]" />
            <p className="font-display text-sm font-bold tracking-tight text-[var(--text-primary)] sm:text-base">
              {periodTitle}
            </p>
            {!isCurrentPeriod && (
              <button
                type="button"
                onClick={() => {
                  if (range === 'monthly') setAnchor(curMonth)
                  else setSelectedYear(curYear)
                }}
                className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[0.6875rem] font-semibold text-[var(--accent)] transition-all hover:opacity-80 active:scale-95 cursor-pointer"
              >
                {range === 'monthly' ? 'Bulan Ini' : 'Tahun Ini'}
              </button>
            )}
          </div>

          <button
            type="button"
            aria-label={t('common.next')}
            onClick={() => {
              if (range === 'monthly') {
                setAnchor(shiftMonth(anchor, 1))
              } else {
                setSelectedYear(String(parseInt(selectedYear, 10) + 1))
              }
            }}
            className="grid size-8 place-items-center rounded-lg border border-[var(--line-subtle)] text-[var(--text-secondary)] transition-all hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] active:scale-95 cursor-pointer"
          >
            <ChevronRight className="size-4.5" />
          </button>
        </div>

        {/* Action Bar Ekspor PDF & CSV */}
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            onClick={handlePrintPdf}
            className="w-full flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer className="size-4" />
            <span>Cetak / Ekspor PDF</span>
          </Button>

          <Button
            variant="secondary"
            onClick={exportCSV}
            className="w-full flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="size-4 text-[var(--accent)]" />
            <span>Unduh CSV / Excel</span>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="print-hidden">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--negative)]">{error}</p>
            <Button size="sm" variant="secondary" onClick={() => void load()}>
              {m('common.retry')}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-5 print:p-0">
        <div className="print-only border-b-2 border-gray-900 pb-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-gray-900">
                Laporan Keuangan
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">
                Periode: {periodTitle}
              </p>
            </div>
            <div className="text-right text-xs text-gray-600">
              <p className="font-semibold text-gray-900">
                {transactions.length} Total Transaksi
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {loading ? (
              <>
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </>
            ) : (
              <>
                <StatTile
                  label="Total Pendapatan (Kredit)"
                  value={formatMoney(income, currency)}
                  tone="positive"
                  hint="Semua dana masuk periode ini"
                  icon={<ArrowUpRight className="size-4" />}
                />
                <StatTile
                  label="Total Beban Belanja (Debit)"
                  value={formatMoney(expense, currency)}
                  tone="negative"
                  hint="Semua pengeluaran periode ini"
                  icon={<ArrowDownRight className="size-4" />}
                />
                <StatTile
                  label={surplus >= 0 ? 'Surplus / Laba Bersih' : 'Defisit Operasional'}
                  value={formatMoney(Math.abs(surplus), currency)}
                  tone={surplus >= 0 ? 'positive' : 'negative'}
                  hint={surplus >= 0 ? `Tingkat Tabungan: ${savingRate}%` : 'Pengeluaran melebihi pemasukan'}
                  icon={<Scale className="size-4" />}
                />
                <StatTile
                  label={range === 'monthly' ? 'Rata-rata Beban Harian' : 'Rata-rata Beban Bulanan'}
                  value={formatMoney(avgExpense, currency)}
                  tone="neutral"
                  hint={range === 'monthly' ? `${daysInMonth} hari pada bulan ini` : 'Rata-rata per bulan'}
                  icon={<TrendingDown className="size-4" />}
                />
              </>
            )}
          </div>

          <Card title="Ikhtisar Laba Rugi Operasional" subtitle="Kalkulasi selisih pendapatan dan beban belanja keluarga">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <tbody>
                  <tr className="border-b border-[var(--line-subtle)]">
                    <td className="py-2.5 font-medium text-[var(--text-secondary)]">Total Pendapatan / Pemasukan Kas</td>
                    <td className="py-2.5 text-right font-bold text-[var(--accent)]">+{formatMoney(income, currency)}</td>
                  </tr>
                  <tr className="border-b border-[var(--line-subtle)]">
                    <td className="py-2.5 font-medium text-[var(--text-secondary)]">Total Beban Operasional / Belanja</td>
                    <td className="py-2.5 text-right font-bold text-[var(--negative)]">−{formatMoney(expense, currency)}</td>
                  </tr>
                  {transferTotal > 0 && (
                    <tr className="border-b border-[var(--line-subtle)]">
                      <td className="py-2.5 font-medium text-[var(--text-secondary)]">Alokasi Transfer Antar Akun / Tabungan</td>
                      <td className="py-2.5 text-right font-semibold text-[var(--text-muted)]">{formatMoney(transferTotal, currency)}</td>
                    </tr>
                  )}
                  <tr className="bg-[var(--surface-sunken)]/60 font-bold">
                    <td className="py-3 px-2 font-display text-sm text-[var(--text-primary)]">
                      {surplus >= 0 ? 'Sisa Kas Bersih (Surplus)' : 'Defisit Bersih Periode'}
                    </td>
                    <td className={[
                      'py-3 px-2 text-right font-display text-sm',
                      surplus >= 0 ? 'text-[var(--accent)]' : 'text-[var(--negative)]',
                    ].join(' ')}>
                      {surplus >= 0 ? '+' : '−'}{formatMoney(Math.abs(surplus), currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* BAGIAN 2: REKAPITULASI MUTASI KAS PER AKUN / DOMPET */}
        <Card
          title="Rekapitulasi Mutasi Kas per Akun / Dompet"
          subtitle="Arus kas masuk dan keluar pada masing-masing rekening dan dompet"
        >
          {loading ? (
            <Skeleton className="h-32" />
          ) : walletLedgers.length === 0 ? (
            <EmptyState title="Belum Ada Akun Aktif" hint="Belum ada transaksi pada dompet untuk periode ini." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--line-strong)] text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--surface-sunken)]/40">
                    <th className="py-2.5 px-3">Akun / Rekening</th>
                    <th className="py-2.5 px-3">Jenis</th>
                    <th className="py-2.5 px-3 text-right">Dana Masuk</th>
                    <th className="py-2.5 px-3 text-right">Dana Keluar</th>
                    <th className="py-2.5 px-3 text-right">Mutasi Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-subtle)]">
                  {walletLedgers.map((item) => (
                    <tr key={item.wallet.id} className="hover:bg-[var(--surface-sunken)]/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <WalletIcon className="size-3.5 text-[var(--accent)] shrink-0" />
                        <span>{item.wallet.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold">
                        {item.wallet.type}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[var(--accent)]">
                        {item.totalIn > 0 ? `+${formatMoney(item.totalIn, currency)}` : 'Rp 0'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[var(--negative)]">
                        {item.totalOut > 0 ? `−${formatMoney(item.totalOut, currency)}` : 'Rp 0'}
                      </td>
                      <td className={[
                        'py-2.5 px-3 text-right font-bold',
                        item.net > 0 ? 'text-[var(--accent)]' : item.net < 0 ? 'text-[var(--negative)]' : 'text-[var(--text-muted)]',
                      ].join(' ')}>
                        {item.net > 0 ? '+' : item.net < 0 ? '−' : ''}{formatMoney(Math.abs(item.net), currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card
          title="Rincian Seluruh Transaksi Periode"
          subtitle={`Daftar ${filteredTransactions.length} transaksi tercatat pada periode ini`}
          className="print-break-auto"
          action={
            <div className="print-hidden flex gap-1 rounded-xl bg-[var(--surface-sunken)] p-1">
              {(['all', 'expense', 'income', 'transfer'] as JournalFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setJournalFilter(f)}
                  className={[
                    'rounded-lg px-2 py-1 text-[0.6875rem] font-semibold transition-all cursor-pointer',
                    journalFilter === f
                      ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] font-bold shadow-2xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {f === 'all' ? 'Semua' : f === 'expense' ? 'Pengeluaran' : f === 'income' ? 'Pemasukan' : 'Transfer'}
                </button>
              ))}
            </div>
          }
        >
          {loading ? (
            <Skeleton className="h-40" />
          ) : filteredTransactions.length === 0 ? (
            <EmptyState title="Tidak Ada Transaksi" hint="Tidak ada entri transaksi yang sesuai dengan filter periode ini." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--line-strong)] text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--surface-sunken)]/40">
                    <th className="py-2.5 px-2 w-8 text-center">No</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Akun / Dompet</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-subtle)]">
                  {filteredTransactions.map((tx, idx) => {
                    const catObj = categoryMap.get(tx.category)
                    const isInc = tx.type === 'income'
                    const isExp = tx.type === 'expense'

                    return (
                      <tr key={tx.id} className="hover:bg-[var(--surface-sunken)]/30 transition-colors">
                        <td className="py-2 px-2 text-center text-[var(--text-muted)] font-mono text-[0.6875rem]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-mono text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap">
                          {tx.date.slice(0, 10)}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                            <span>{catObj?.icon || (isInc ? '💰' : '🏷️')}</span>
                            <span>{catObj?.name || tx.category || 'Tanpa Kategori'}</span>
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[var(--text-secondary)] whitespace-nowrap">
                          {tx.type === 'transfer' ? (
                            <span>
                              {walletMap.get(tx.wallet) ?? '-'} &rarr; {walletMap.get(tx.toWallet) ?? '-'}
                            </span>
                          ) : (
                            walletMap.get(tx.wallet) ?? '-'
                          )}
                        </td>
                        <td className="py-2 px-3 text-[var(--text-muted)] max-w-xs truncate">
                          {tx.note || '-'}
                        </td>
                        <td className={[
                          'py-2 px-3 text-right font-bold whitespace-nowrap font-mono',
                          isInc ? 'text-[var(--accent)]' : isExp ? 'text-[var(--negative)]' : 'text-[var(--text-primary)]',
                        ].join(' ')}>
                          {isInc ? '+' : isExp ? '−' : ''}{formatMoney(tx.amount, currency)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--line-strong)] bg-[var(--surface-sunken)]/60 font-bold">
                    <td colSpan={5} className="py-2.5 px-3 text-right font-display text-xs">
                      Total ({filteredTransactions.length} entri):
                    </td>
                    <td className="py-2.5 px-3 text-right font-display text-xs text-[var(--text-primary)] font-mono">
                      {formatMoney(filteredTotal, currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}