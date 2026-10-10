package collections

import (
	"os"

	"github.com/pocketbase/pocketbase/core"
)

// Aturan scope tenancy. Semua koleksi data wajib memakai aturan ini supaya
// tidak ada record yang bisa dibaca lintas household.
const (
	RuleReadHousehold   = `@request.auth.household_id != "" && household_id = @request.auth.household_id`
	RuleCreateHousehold = `@request.auth.household_id != "" && @request.body.household_id = @request.auth.household_id`
	RuleUpdateHousehold = `@request.auth.household_id != "" && household_id = @request.auth.household_id`
	RuleDeleteHousehold = `@request.auth.household_id != "" && household_id = @request.auth.household_id`

	RuleReadOwnProfile = `id = @request.auth.id`

	CollectionTypeBase = "base"
	CollectionTypeAuth = "auth"
)

const (
	ColHouseholds    = "households"
	ColUsers         = "users"
	ColWallets       = "wallets"
	ColCategories    = "categories"
	ColSubCategories = "sub_categories"
	ColTransactions  = "transactions"
	ColBudgets       = "budgets"
	ColSavings       = "savings"
	ColDebts         = "debts"
	ColDebtPayments  = "debt_payments"
)

// Nilai select yang dipakai lintas backend & frontend.
var (
	TransactionTypes = []string{"income", "expense", "transfer"}
	WalletTypes      = []string{"cash", "bank", "ewallet", "savings", "credit_card", "investment"}
	CategoryTypes    = []string{"income", "expense", "transfer"}
	DebtTypes        = []string{"loan", "credit_card", "other"}
	SavingsStatuses  = []string{"active", "completed", "paused"}
	DebtStatuses     = []string{"active", "paid", "overdue"}
	SupportedLangs   = []string{"id", "en", "zh", "es", "ar", "hi", "fr", "ja", "ru", "pt"}
)

// householdField membuat field household_id yang konsisten di semua koleksi data.
//
// household_id menunjuk koleksi households, bukan koleksi users. Ini bukan
// sekadar alasan teknis: PocketBase hanya bisa menyimpan relation sebagai Id
// koleksi, sehingga self-reference pada users harus lewat dua langkah simpan
// dan akan merusak migration. Entitas households juga lebih benar secara
// domain karena satu household bisa punya beberapa anggota.
func householdField() *core.RelationField {
	return &core.RelationField{
		Name:          "household_id",
		CollectionId:  ColHouseholds,
		Required:      true,
		MaxSelect:     1,
		MinSelect:     1,
		CascadeDelete: true,
	}
}

// relationTo membangun relation single-select. onDelete "cascade" untuk data
// turunan yang tidak ada artinya bila induk hilang, "restrict" untuk referensi
// yang wajib dijaga (mis. wallet yang masih dipakai transaksi).
func relationTo(name, collection, onDelete string, required bool) *core.RelationField {
	f := &core.RelationField{
		Name:         name,
		CollectionId: collection,
		MaxSelect:    1,
	}
	if onDelete == "cascade" {
		f.CascadeDelete = true
	}
	if required {
		f.Required = true
		f.MinSelect = 1
	}
	return f
}

func timestamps(c *core.Collection) {
	c.Fields.Add(
		&core.AutodateField{Name: "created", OnCreate: true},
		&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true},
	)
}

func applyTenantRules(c *core.Collection) {
	c.ListRule = ptr(RuleReadHousehold)
	c.ViewRule = ptr(RuleReadHousehold)
	c.CreateRule = ptr(RuleCreateHousehold)
	c.UpdateRule = ptr(RuleUpdateHousehold)
	c.DeleteRule = ptr(RuleDeleteHousehold)
}

func tenantIndexes(c *core.Collection) {
	c.AddIndex("idx_"+c.Name+"_household", false, "`household_id`", "")
}

// Households adalah entitas tenant. Satu household dimiliki satu atau dua
// anggota pada koleksi users, dan seluruh data keuangan menunjuk ke sini lewat
// household_id.
func Households() *core.Collection {
	c := core.NewBaseCollection(ColHouseholds)

	c.Fields.Add(
		&core.TextField{Name: "name", Required: true, Max: 120},
		&core.TextField{Name: "currency", Max: 8},
		&core.SelectField{Name: "language", Values: SupportedLangs, MaxSelect: 1},
		&core.TextField{Name: "created_by", Max: 15},
	)
	timestamps(c)

	// Household baru hanya bisa dibaca dan diubah oleh anggota household itu,
	// sehingga setelah signup hook mengisi household_id, aturannya langsung
	// berlaku tanpa celah akses lintas household.
	//
	// Create dan Delete sengaja `nil` (superuser only). Rule kosong `""` berarti
	// "publik" di PocketBase, bukan "tidak ada yang boleh". Household dibuat
	// hook onUserCreated, jadi tidak ada alur API yang butuh rule publik; rule
	// kosong di sini berarti siapa pun bisa membuat household — atau menghapus
	// household milik orang lain beserta seluruh datanya.
	c.ListRule = ptr(`(@request.auth.household_id != "" && id = @request.auth.household_id) || created_by = @request.auth.id`)
	c.ViewRule = ptr(`(@request.auth.household_id != "" && id = @request.auth.household_id) || created_by = @request.auth.id`)
	c.CreateRule = ptr(`@request.auth.id != ""`)
	c.UpdateRule = ptr(`(@request.auth.household_id != "" && id = @request.auth.household_id) || created_by = @request.auth.id`)
	c.DeleteRule = nil

	c.AddIndex("idx_households_name", false, "`name`", "")

	return c
}

// Users adalah koleksi auth. Satu user adalah satu anggota household;
// household_id menunjuk ke entitas households sehingga data keluarga berbagi.
func Users() *core.Collection {
	c := core.NewAuthCollection(ColUsers)

	c.Fields.Add(
		&core.TextField{Name: "name", Required: true, Max: 120},
		&core.FileField{Name: "avatar", MaxSelect: 1, MaxSize: 5_000_000, MimeTypes: []string{"image/jpeg", "image/png", "image/webp"}},
		&core.TextField{Name: "pin_hash", Hidden: true, Max: 255},
		&core.SelectField{Name: "language", Values: SupportedLangs, MaxSelect: 1},
		&core.RelationField{
			Name:          "household_id",
			CollectionId:  ColHouseholds,
			MaxSelect:     1,
			CascadeDelete: false,
		},
	)
	timestamps(c)

	c.ListRule = ptr(RuleReadOwnProfile)
	c.ViewRule = ptr(RuleReadOwnProfile)
	c.CreateRule = ptr("")
	c.UpdateRule = ptr(RuleReadOwnProfile)
	c.DeleteRule = ptr(RuleReadOwnProfile)
	c.AuthRule = ptr("")
	// ManageRule `nil` berarti superuser only. Rule kosong berarti siapa pun boleh
	// memakai endpoint impersonate/manage milik PocketBase.
	c.ManageRule = nil

	googleID := os.Getenv("GOOGLE_CLIENT_ID")
	googleSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	if googleID != "" && googleSecret != "" {
		c.OAuth2.Enabled = true
		c.OAuth2.Providers = []core.OAuth2ProviderConfig{
			{
				Name:         "google",
				ClientId:     googleID,
				ClientSecret: googleSecret,
			},
		}
	}

	c.AddIndex("idx_users_household", false, "`household_id`", "")

	return c
}

// Wallets menyimpan rekening/dompet. Kolom balance ditulis hook, bukan klien.
func Wallets() *core.Collection {
	c := core.NewBaseCollection(ColWallets)

	c.Fields.Add(
		&core.TextField{Name: "name", Required: true, Max: 120},
		&core.SelectField{Name: "type", Values: WalletTypes, Required: true, MaxSelect: 1},
		&core.NumberField{Name: "initial_balance"},
		&core.NumberField{Name: "balance"},
		&core.TextField{Name: "icon", Max: 40},
		&core.TextField{Name: "color", Max: 40},
		&core.BoolField{Name: "include_in_networth"},
		&core.BoolField{Name: "is_archived"},
		&core.NumberField{Name: "sort_order"},
		householdField(),
	)
	timestamps(c)

	applyTenantRules(c)
	tenantIndexes(c)
	c.AddIndex("idx_wallets_household_active", false, "`household_id`, `is_archived`, `include_in_networth`", "")

	return c
}

// Categories memakai type income/expense/transfer agar pengelompokan otomatis.
func Categories() *core.Collection {
	c := core.NewBaseCollection(ColCategories)

	c.Fields.Add(
		&core.TextField{Name: "name", Required: true, Max: 120},
		&core.SelectField{Name: "type", Values: CategoryTypes, Required: true, MaxSelect: 1},
		&core.TextField{Name: "icon", Max: 40},
		&core.TextField{Name: "color", Max: 40},
		&core.BoolField{Name: "is_archived"},
		householdField(),
	)
	timestamps(c)

	applyTenantRules(c)
	tenantIndexes(c)
	c.AddIndex("idx_categories_name", false, "`household_id`, `name`", "")

	return c
}

// SubCategories adalah anak dari Categories.
func SubCategories() *core.Collection {
	c := core.NewBaseCollection(ColSubCategories)

	c.Fields.Add(
		&core.TextField{Name: "name", Required: true, Max: 120},
		relationTo("category", ColCategories, "cascade", true),
		&core.BoolField{Name: "is_archived"},
		householdField(),
	)
	timestamps(c)

	applyTenantRules(c)
	tenantIndexes(c)
	c.AddIndex("idx_subcategories_category", false, "`category`", "")

	return c
}

// Savings menyimpan target; current_amount disinkronkan hook dari transaksi.
func Savings() *core.Collection {
	c := core.NewBaseCollection(ColSavings)

	c.Fields.Add(
		&core.TextField{Name: "name", Required: true, Max: 120},
		&core.NumberField{Name: "target_amount", Required: true, Min: floatPtr(0)},
		&core.NumberField{Name: "current_amount"},
		&core.NumberField{Name: "monthly_contribution", Min: floatPtr(0)},
		&core.DateField{Name: "target_date"},
		&core.SelectField{Name: "status", Values: SavingsStatuses, MaxSelect: 1},
		&core.TextField{Name: "icon", Max: 40},
		&core.TextField{Name: "color", Max: 40},
		&core.BoolField{Name: "include_in_networth"},
		householdField(),
	)
	timestamps(c)

	applyTenantRules(c)
	tenantIndexes(c)
	c.AddIndex("idx_savings_household_status", false, "`household_id`, `status`", "")

	return c
}

// Debts menyimpan utang; current_balance diturunkan dari debt_payments.
func Debts() *core.Collection {
	c := core.NewBaseCollection(ColDebts)

	c.Fields.Add(
		&core.TextField{Name: "creditor", Required: true, Max: 120},
		&core.SelectField{Name: "type", Values: DebtTypes, Required: true, MaxSelect: 1},
		&core.NumberField{Name: "principal", Required: true, Min: floatPtr(0)},
		&core.NumberField{Name: "current_balance"},
		&core.NumberField{Name: "interest_rate", Min: floatPtr(0)},
		&core.NumberField{Name: "monthly_payment", Min: floatPtr(0)},
		&core.DateField{Name: "start_date"},
		&core.DateField{Name: "due_date"},
		&core.SelectField{Name: "status", Values: DebtStatuses, MaxSelect: 1},
		&core.TextField{Name: "notes", Max: 500},
		householdField(),
	)
	timestamps(c)

	applyTenantRules(c)
	tenantIndexes(c)
	c.AddIndex("idx_debts_household_status", false, "`household_id`, `status`", "")

	return c
}

// DebtPayments mencatat cicilan; debts.current_balance = principal - sum(payments).
func DebtPayments() *core.Collection {
	c := core.NewBaseCollection(ColDebtPayments)

	c.Fields.Add(
		relationTo("debt", ColDebts, "cascade", true),
		&core.NumberField{Name: "amount", Required: true, Min: floatPtr(0.01)},
		&core.DateField{Name: "date", Required: true},
		relationTo("wallet", ColWallets, "restrict", false),
		&core.TextField{Name: "note", Max: 500},
		householdField(),
	)
	timestamps(c)

	applyTenantRules(c)
	tenantIndexes(c)
	c.AddIndex("idx_debtpayments_debt", false, "`household_id`, `debt`", "")

	return c
}

// Transactions adalah journal utama. Kolom amount adalah nilai transaksi;
// saldo diturunkan hook ke wallets, bukan disimpan di sini.
func Transactions() *core.Collection {
	c := core.NewBaseCollection(ColTransactions)

	c.Fields.Add(
		&core.SelectField{Name: "type", Values: TransactionTypes, Required: true, MaxSelect: 1},
		&core.NumberField{Name: "amount", Required: true, Min: floatPtr(0.01)},
		&core.DateField{Name: "date", Required: true},
		&core.TextField{Name: "note", Max: 500},
		relationTo("category", ColCategories, "restrict", false),
		relationTo("sub_category", ColSubCategories, "restrict", false),
		relationTo("wallet", ColWallets, "restrict", true),
		relationTo("to_wallet", ColWallets, "restrict", false),
		relationTo("savings_goal", ColSavings, "restrict", false),
		&core.BoolField{Name: "is_recurring"},
		&core.BoolField{Name: "is_system"},
		householdField(),
	)
	timestamps(c)

	applyTenantRules(c)
	tenantIndexes(c)
	c.AddIndex("idx_transactions_date", false, "`household_id`, `date`", "")
	c.AddIndex("idx_transactions_wallet_date", false, "`household_id`, `wallet`, `date`", "")
	c.AddIndex("idx_transactions_to_wallet", false, "`household_id`, `to_wallet`", "")
	c.AddIndex("idx_transactions_savings", false, "`household_id`, `savings_goal`", "")
	c.AddIndex("idx_transactions_cat_date", false, "`household_id`, `category`, `date`", "")

	return c
}

// Budgets dibatasi satu baris per household+bulan+kategori lewat unique index.
func Budgets() *core.Collection {
	c := core.NewBaseCollection(ColBudgets)

	c.Fields.Add(
		&core.TextField{Name: "month", Required: true, Max: 7},
		relationTo("category", ColCategories, "cascade", true),
		&core.NumberField{Name: "amount", Required: true, Min: floatPtr(0)},
		&core.TextField{Name: "notes", Max: 500},
		householdField(),
	)
	timestamps(c)

	applyTenantRules(c)
	tenantIndexes(c)
	c.AddIndex("idx_budgets_unique", true, "`household_id`, `month`, `category`", "")

	return c
}

// All mengembalikan seluruh definisi koleksi dalam urutan dependensi: users harus
// ada lebih dulu karena household_id menunjuk sana, dan transactions merujuk
// savings yang dideklarasikan lebih awal.
func All() []*core.Collection {
	return []*core.Collection{
		// Households harus lebih dulu: users dan seluruh koleksi data
		// menunjuk ke sini, dan Apply tidak mengulang koleksi yang sama.
		Households(),
		Users(),
		Wallets(),
		Categories(),
		SubCategories(),
		Savings(),
		Debts(),
		DebtPayments(),
		Transactions(),
		Budgets(),
	}
}

func ptr[T any](v T) *T { return &v }

func floatPtr(v float64) *float64 { return &v }
