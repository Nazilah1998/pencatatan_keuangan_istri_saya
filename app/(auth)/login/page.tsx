import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect('/');
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        padding: '1.5rem',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
        }}
      >
        <div>
          <div
            style={{
              width: 64, height: 64,
              background: 'var(--color-primary)',
              borderRadius: 'var(--radius-xl)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', margin: '0 auto 1.25rem',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            💎
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
            Tyaaa Financee
          </h1>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Smart personal financial tracking integrated with Google Sheets. 
            Lacak pemasukan, pengeluaran, anggaran, dan tabungan dengan Tyaaa Financee.
          </p>
        </div>

        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/' });
          }}
          style={{ width: '100%' }}
        >
          <Button type="submit" size="md" style={{ width: '100%', minHeight: 48, fontSize: '1rem' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" style={{ marginRight: '0.5rem' }}>
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Masuk dengan Google
          </Button>
        </form>

        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Aplikasi ini membutuhkan akses ke Google Sheets Anda untuk menyimpan data keuangan secara privat.
        </p>
      </div>
    </div>
  );
}
