-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"tanggal" date NOT NULL,
	"jenis" text,
	"jumlah" numeric NOT NULL,
	"kategori" text,
	"sub_kategori" text,
	"dompet" text,
	"deskripsi" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "transactions_jenis_check" CHECK (jenis = ANY (ARRAY['pemasukan'::text, 'pengeluaran'::text]))
);
--> statement-breakpoint
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"kategori" text NOT NULL,
	"batas_bulanan" numeric NOT NULL,
	"periode" text,
	"catatan" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "budgets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "savings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"nama_tujuan" text NOT NULL,
	"target_jumlah" numeric NOT NULL,
	"jumlah_terkumpul" numeric DEFAULT '0',
	"target_tanggal" date,
	"ikon" text,
	"warna" text,
	"deskripsi" text,
	"prioritas" text,
	"status" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "savings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nama" text NOT NULL,
	"jenis" text NOT NULL,
	"nilai" numeric DEFAULT '0' NOT NULL,
	"tanggal_update" date DEFAULT CURRENT_DATE NOT NULL,
	"catatan" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now())
);
--> statement-breakpoint
ALTER TABLE "assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "debts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nama_hutang" text NOT NULL,
	"jenis" text NOT NULL,
	"total_awal" numeric DEFAULT '0' NOT NULL,
	"sisa_hutang" numeric DEFAULT '0' NOT NULL,
	"cicilan_bulanan" numeric DEFAULT '0' NOT NULL,
	"tanggal_jatuh_tempo" date,
	"catatan" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now())
);
--> statement-breakpoint
ALTER TABLE "debts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"full_name" text,
	"avatar_url" text,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
	"bahasa" text DEFAULT 'en',
	"mata_uang" text DEFAULT 'IDR',
	"format_tanggal" text DEFAULT 'DD/MM/YYYY',
	"nama_pengguna" text,
	"nama_panggilan" text,
	"nama_rumah_tangga" text DEFAULT 'Rumah Tangga Saya',
	"tema_warna" text DEFAULT '#ff85a2',
	"custom_categories" jsonb,
	"custom_wallets" jsonb,
	"logo_url" text,
	"anggota" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "profiles_email_key" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings" ADD CONSTRAINT "savings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Users can access their own transactions" ON "transactions" AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can only see their own transactions" ON "transactions" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can access their own budgets" ON "budgets" AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can only see their own budgets" ON "budgets" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can access their own savings" ON "savings" AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can only see their own savings" ON "savings" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can access their own assets" ON "assets" AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can only access their own assets" ON "assets" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can only see their own assets" ON "assets" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can access their own debts" ON "debts" AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can only access their own debts" ON "debts" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can only see their own debts" ON "debts" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can insert own profile" ON "profiles" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = id));--> statement-breakpoint
CREATE POLICY "Users can update own profile" ON "profiles" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can view own profile" ON "profiles" AS PERMISSIVE FOR SELECT TO public;
*/