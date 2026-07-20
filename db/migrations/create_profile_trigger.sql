-- Script: Otomatisasi Pembuatan Profile saat User Baru Sign Up
-- Jalankan script ini di Supabase SQL Editor

-- 1. Buat fungsi trigger yang akan memasukkan data ke public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Hapus trigger jika sudah ada sebelumnya agar tidak duplikat
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Buat trigger di tabel auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
