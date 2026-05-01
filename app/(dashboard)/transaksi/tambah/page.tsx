'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TransactionForm } from '@/components/transaksi/TransactionForm';
import { Button } from '@/components/ui/Button';

export default function TambahTransaksiPage() {
  const router = useRouter();

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>Tambah Transaksi</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Catat pemasukan atau pengeluaran baru</p>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <TransactionForm onSuccess={() => router.push('/transaksi')} />
      </div>
    </div>
  );
}
