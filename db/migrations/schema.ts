import { pgTable, foreignKey, pgPolicy, check, uuid, date, text, numeric, timestamp, unique, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const transactions = pgTable("transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	tanggal: date().notNull(),
	jenis: text(),
	jumlah: numeric().notNull(),
	kategori: text(),
	subKategori: text("sub_kategori"),
	dompet: text(),
	deskripsi: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "transactions_user_id_fkey"
		}),
	pgPolicy("Users can access their own transactions", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Users can only see their own transactions", { as: "permissive", for: "all", to: ["public"] }),
	check("transactions_jenis_check", sql`jenis = ANY (ARRAY['pemasukan'::text, 'pengeluaran'::text])`),
]);

export const budgets = pgTable("budgets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	kategori: text().notNull(),
	batasBulanan: numeric("batas_bulanan").notNull(),
	periode: text(),
	catatan: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "budgets_user_id_fkey"
		}),
	pgPolicy("Users can access their own budgets", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Users can only see their own budgets", { as: "permissive", for: "all", to: ["public"] }),
]);

export const savings = pgTable("savings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	namaTujuan: text("nama_tujuan").notNull(),
	targetJumlah: numeric("target_jumlah").notNull(),
	jumlahTerkumpul: numeric("jumlah_terkumpul").default('0'),
	targetTanggal: date("target_tanggal"),
	ikon: text(),
	warna: text(),
	deskripsi: text(),
	prioritas: text(),
	status: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "savings_user_id_fkey"
		}),
	pgPolicy("Users can access their own savings", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Users can only see their own savings", { as: "permissive", for: "all", to: ["public"] }),
]);

export const assets = pgTable("assets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	nama: text().notNull(),
	jenis: text().notNull(),
	nilai: numeric().default('0').notNull(),
	tanggalUpdate: date("tanggal_update").default(sql`CURRENT_DATE`).notNull(),
	catatan: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "assets_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can access their own assets", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Users can only access their own assets", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("Users can only see their own assets", { as: "permissive", for: "all", to: ["public"] }),
]);

export const debts = pgTable("debts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	namaHutang: text("nama_hutang").notNull(),
	jenis: text().notNull(),
	totalAwal: numeric("total_awal").default('0').notNull(),
	sisaHutang: numeric("sisa_hutang").default('0').notNull(),
	cicilanBulanan: numeric("cicilan_bulanan").default('0').notNull(),
	tanggalJatuhTempo: date("tanggal_jatuh_tempo"),
	catatan: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "debts_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can access their own debts", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Users can only access their own debts", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("Users can only see their own debts", { as: "permissive", for: "all", to: ["public"] }),
]);

export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	email: text(),
	fullName: text("full_name"),
	avatarUrl: text("avatar_url"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
	bahasa: text().default('en'),
	mataUang: text("mata_uang").default('IDR'),
	formatTanggal: text("format_tanggal").default('DD/MM/YYYY'),
	namaPengguna: text("nama_pengguna"),
	namaPanggilan: text("nama_panggilan"),
	namaRumahTangga: text("nama_rumah_tangga").default('Rumah Tangga Saya'),
	temaWarna: text("tema_warna").default('#ff85a2'),
	customCategories: jsonb("custom_categories"),
	customWallets: jsonb("custom_wallets"),
	logoUrl: text("logo_url"),
	anggota: jsonb().default([]),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "profiles_id_fkey"
		}).onDelete("cascade"),
	unique("profiles_email_key").on(table.email),
	pgPolicy("Users can insert own profile", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`(auth.uid() = id)`  }),
	pgPolicy("Users can update own profile", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can view own profile", { as: "permissive", for: "select", to: ["public"] }),
]);
