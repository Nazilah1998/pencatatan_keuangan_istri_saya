import {
  pgTable,
  uuid,
  text,
  numeric,
  date,
  timestamp,
  jsonb,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ============================================================================
// PROFILES TABLE
// ============================================================================
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // references auth.users.id
  email: text("email").unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(
    sql`timezone('utc'::text, now())`,
  ),
  bahasa: text("bahasa").default("en"),
  matauang: text("mata_uang").default("IDR"),
  formatTanggal: text("format_tanggal").default("DD/MM/YYYY"),
  namaPengguna: text("nama_pengguna"),
  namaPanggilan: text("nama_panggilan"),
  namaRumahTangga: text("nama_rumah_tangga").default("Rumah Tangga Saya"),
  temaWarna: text("tema_warna").default("#ff85a2"),
  customCategories: jsonb("custom_categories"),
  customWallets: jsonb("custom_wallets"),
  logoUrl: text("logo_url"),
  anggota: jsonb("anggota").default(sql`'[]'::jsonb`),
});

// ============================================================================
// TRANSACTIONS TABLE
// ============================================================================
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id"),
    tanggal: date("tanggal").notNull(),
    jenis: text("jenis"),
    jumlah: numeric("jumlah").notNull(),
    kategori: text("kategori"),
    subKategori: text("sub_kategori"),
    dompet: text("dompet"),
    deskripsi: text("deskripsi"),
    createdAt: timestamp("created_at", { withTimezone: true }).default(
      sql`now()`,
    ),
  },
  (table) => [
    check(
      "transactions_jenis_check",
      sql`${table.jenis} = ANY (ARRAY['pemasukan'::text, 'pengeluaran'::text])`,
    ),
  ],
);

// ============================================================================
// ASSETS TABLE
// ============================================================================
export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  nama: text("nama").notNull(),
  jenis: text("jenis").notNull(),
  nilai: numeric("nilai").default("0"),
  tanggalUpdate: date("tanggal_update").default(sql`CURRENT_DATE`),
  catatan: text("catatan"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(
    sql`timezone('utc'::text, now())`,
  ),
});

// ============================================================================
// DEBTS TABLE
// ============================================================================
export const debts = pgTable("debts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  namaHutang: text("nama_hutang").notNull(),
  jenis: text("jenis").notNull(),
  totalAwal: numeric("total_awal").default("0"),
  sisaHutang: numeric("sisa_hutang").default("0"),
  cicilanBulanan: numeric("cicilan_bulanan").default("0"),
  tanggalJatuhTempo: date("tanggal_jatuh_tempo"),
  catatan: text("catatan"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(
    sql`timezone('utc'::text, now())`,
  ),
});

// ============================================================================
// BUDGETS TABLE
// ============================================================================
export const budgets = pgTable("budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  kategori: text("kategori").notNull(),
  batasBulanan: numeric("batas_bulanan").notNull(),
  periode: text("periode"),
  catatan: text("catatan"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(
    sql`now()`,
  ),
});

// ============================================================================
// SAVINGS TABLE
// ============================================================================
export const savings = pgTable("savings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  namaTujuan: text("nama_tujuan").notNull(),
  targetJumlah: numeric("target_jumlah").notNull(),
  jumlahTerkumpul: numeric("jumlah_terkumpul").default("0"),
  targetTanggal: date("target_tanggal"),
  ikon: text("ikon"),
  warna: text("warna"),
  deskripsi: text("deskripsi"),
  prioritas: text("prioritas"),
  status: text("status"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(
    sql`now()`,
  ),
});

// ============================================================================
// RELATIONS
// ============================================================================
export const profilesRelations = relations(profiles, ({ many }) => ({
  transactions: many(transactions),
  assets: many(assets),
  debts: many(debts),
  budgets: many(budgets),
  savings: many(savings),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  profile: one(profiles, {
    fields: [transactions.userId],
    references: [profiles.id],
  }),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  profile: one(profiles, {
    fields: [assets.userId],
    references: [profiles.id],
  }),
}));

export const debtsRelations = relations(debts, ({ one }) => ({
  profile: one(profiles, {
    fields: [debts.userId],
    references: [profiles.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  profile: one(profiles, {
    fields: [budgets.userId],
    references: [profiles.id],
  }),
}));

export const savingsRelations = relations(savings, ({ one }) => ({
  profile: one(profiles, {
    fields: [savings.userId],
    references: [profiles.id],
  }),
}));
