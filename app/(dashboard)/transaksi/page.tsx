'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Download } from 'lucide-react';
import { getTransactions } from '@/app/actions/transactions';
import { TransactionTable } from '@/components/transaksi/TransactionTable';
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { arrayToCSV, downloadCSV } from '@/lib/utils';
import { Transaction } from '@/types';

export default function TransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    const res = await getTransactions();
    if (res.success && res.data) setTransactions(res.data);
    setLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchTransactions());
  }, []);

  const handleExport = () => {
    const headers = ['ID', 'Tanggal', 'Jenis', 'Jumlah', 'Kategori', 'Dompet', 'Deskripsi'];
    const rows = transactions.map(t => [
      t.id, t.tanggal, t.jenis, String(t.jumlah), t.kategori, t.dompet, t.deskripsi
    ]);
    const csv = arrayToCSV(headers, rows);
    downloadCSV(csv, 'transaksi.csv');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>Daftar Transaksi</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Kelola riwayat pemasukan dan pengeluaran</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" onClick={handleExport} size="sm">
            <Download size={16} /> Export
          </Button>
          <Link href="/transaksi/tambah" style={{ textDecoration: 'none' }}>
            <Button size="sm">
              <Plus size={16} /> Tambah
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '1.5rem' }}><TableSkeleton /></div>
      ) : (
        <TransactionTable transactions={transactions} onRefresh={fetchTransactions} />
      )}
    </div>
  );
}
