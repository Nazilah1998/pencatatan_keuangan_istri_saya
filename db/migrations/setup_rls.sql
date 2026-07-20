-- Script: Setup Row Level Security (RLS)
-- Jalankan script ini di Supabase SQL Editor

-- 1. Mengaktifkan RLS pada semua tabel terkait pengguna
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;

-- 2. Membuat Policy untuk tabel profiles (User hanya bisa akses & ubah data mereka sendiri)
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- (Opsional) Jika aplikasi insert row profile bukan lewat trigger melainkan aplikasi, tambahkan:
-- CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Membuat Policy untuk tabel transactions
CREATE POLICY "Users can manage own transactions"
ON public.transactions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Membuat Policy untuk tabel assets
CREATE POLICY "Users can manage own assets"
ON public.assets FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Membuat Policy untuk tabel debts
CREATE POLICY "Users can manage own debts"
ON public.debts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Membuat Policy untuk tabel budgets
CREATE POLICY "Users can manage own budgets"
ON public.budgets FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. Membuat Policy untuk tabel savings
CREATE POLICY "Users can manage own savings"
ON public.savings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- CATATAN PENTING UNTUK SHARED FAMILY MODE:
-- Karena saat ini struktur policy memakai 'user_id' untuk akses data.
-- Saat nanti Anda mulai membagikan 'household_id', policy di atas harus diubah agar
-- mengecek apakah (SELECT household_id FROM profiles WHERE id = auth.uid()) = household_id pada data.
