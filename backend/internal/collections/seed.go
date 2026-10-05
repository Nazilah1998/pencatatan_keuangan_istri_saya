package collections

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/pocketbase/pocketbase/core"
)

// SeedHousehold membuat kategori, sub-kategori, dan dompet bawaan untuk satu
// household baru. Idempotent: dipanggil ulang tidak menduplikasi data.
//
// Nilai warna disimpan sebagai token nama (bukan hex) agar frontend bisa memetakan
// ke CSS variable di global.css sesuai aturan tema.
type CategorySeed struct {
	Name  string
	Icon  string
	Color string
}

type SubCategorySeed struct {
	Parent string
	Name   string
	Icon   string
}

type WalletSeed struct {
	Name           string
	Type           string
	Icon           string
	Color          string
	IncludeInWorth bool
}

var (
	IncomeCategorySeeds = []CategorySeed{
		{Name: "Gaji", Icon: "💰", Color: "emerald"},
		{Name: "Bonus Kantor", Icon: "✨", Color: "green"},
		{Name: "Freelance", Icon: "💻", Color: "lime"},
		{Name: "Investasi", Icon: "📈", Color: "blue"},
		{Name: "Hadiah", Icon: "🎁", Color: "fuchsia"},
		{Name: "Penjualan", Icon: "🏷️", Color: "teal"},
	}

	ExpenseCategorySeeds = []CategorySeed{
		{Name: "Jajan Comel", Icon: "🍿", Color: "orange"},
		{Name: "Transportasi", Icon: "🚗", Color: "blue"},
		{Name: "Belanja Online", Icon: "🛍️", Color: "violet"},
		{Name: "Belanja Offline", Icon: "🧺", Color: "lime"},
		{Name: "Tagihan & Utilitas", Icon: "⚡", Color: "red"},
		{Name: "Kesehatan", Icon: "🏥", Color: "emerald"},
		{Name: "Pendidikan", Icon: "🎓", Color: "cyan"},
		{Name: "Biaya Perjalanan", Icon: "🧳", Color: "amber"},
		{Name: "Hiburan", Icon: "🎬", Color: "pink"},
		{Name: "Sosial & Donasi", Icon: "🤝", Color: "teal"},
		{Name: "Cicilan", Icon: "💸", Color: "red"},
		{Name: "Tabungan", Icon: "🐷", Color: "green"},
	}

	SubCategorySeeds = []SubCategorySeed{
		{Parent: "Jajan Comel", Name: "Makan Diluar", Icon: "🍔"},
		{Parent: "Jajan Comel", Name: "Jajan Kecil", Icon: "🍬"},
		{Parent: "Jajan Comel", Name: "Rokok", Icon: "🚬"},
		{Parent: "Transportasi", Name: "Mobil", Icon: "🚘"},
		{Parent: "Transportasi", Name: "Motor", Icon: "🏍️"},
		{Parent: "Tagihan & Utilitas", Name: "Listrik", Icon: "💡"},
		{Parent: "Tagihan & Utilitas", Name: "Wifi", Icon: "🌐"},
		{Parent: "Tagihan & Utilitas", Name: "PDAM", Icon: "💧"},
		{Parent: "Tagihan & Utilitas", Name: "Paket Data", Icon: "📱"},
		{Parent: "Belanja Online", Name: "Pakaian", Icon: "👕"},
		{Parent: "Belanja Online", Name: "Skincare", Icon: "✨"},
		{Parent: "Belanja Online", Name: "Perabotan Rumah", Icon: "🏠"},
		{Parent: "Belanja Offline", Name: "Mini Market", Icon: "🏪"},
		{Parent: "Belanja Offline", Name: "Pasar", Icon: "🧺"},
		{Parent: "Biaya Perjalanan", Name: "Bensin", Icon: "⛽"},
		{Parent: "Biaya Perjalanan", Name: "Konsumsi", Icon: "🍽️"},
		{Parent: "Biaya Perjalanan", Name: "Penginapan", Icon: "🏨"},
		{Parent: "Cicilan", Name: "SpayLater", Icon: "🧡"},
		{Parent: "Cicilan", Name: "PayLater", Icon: "🖤"},
		{Parent: "Cicilan", Name: "Cicilan Bank", Icon: "🏦"},
		{Parent: "Kesehatan", Name: "Obat", Icon: "💊"},
		{Parent: "Kesehatan", Name: "Check Up", Icon: "🩺"},
	}

	WalletSeeds = []WalletSeed{
		{Name: "Cash", Type: "cash", Icon: "💵", Color: "emerald", IncludeInWorth: true},
		{Name: "Bank BCA", Type: "bank", Icon: "🏦", Color: "blue", IncludeInWorth: true},
		{Name: "Bank Mandiri", Type: "bank", Icon: "🏦", Color: "blue", IncludeInWorth: true},
		{Name: "Bank BNI", Type: "bank", Icon: "🏦", Color: "blue", IncludeInWorth: true},
		{Name: "Bank BRI", Type: "bank", Icon: "🏦", Color: "cyan", IncludeInWorth: true},
		{Name: "Bank BSI", Type: "bank", Icon: "🏦", Color: "violet", IncludeInWorth: true},
		{Name: "GoPay", Type: "ewallet", Icon: "📱", Color: "teal", IncludeInWorth: true},
		{Name: "OVO", Type: "ewallet", Icon: "📱", Color: "purple", IncludeInWorth: true},
		{Name: "Dana", Type: "ewallet", Icon: "📱", Color: "blue", IncludeInWorth: true},
		{Name: "ShopeePay", Type: "ewallet", Icon: "🧡", Color: "orange", IncludeInWorth: true},
		{Name: "LinkAja", Type: "ewallet", Icon: "❤️", Color: "red", IncludeInWorth: true},
		{Name: "Kartu Kredit", Type: "credit_card", Icon: "💳", Color: "red", IncludeInWorth: true},
	}
)

// SeedHousehold mengisi kategori & dompet bawaan milik household tertentu.
func SeedHousehold(app core.App, householdID string) error {
	if householdID == "" {
		return errors.New("seed household: householdID kosong")
	}

	return app.RunInTransaction(func(txApp core.App) error {
		catCol, err := txApp.FindCachedCollectionByNameOrId(ColCategories)
		if err != nil {
			return fmt.Errorf("koleksi %s: %w", ColCategories, err)
		}
		subCol, err := txApp.FindCachedCollectionByNameOrId(ColSubCategories)
		if err != nil {
			return fmt.Errorf("koleksi %s: %w", ColSubCategories, err)
		}
		walletCol, err := txApp.FindCachedCollectionByNameOrId(ColWallets)
		if err != nil {
			return fmt.Errorf("koleksi %s: %w", ColWallets, err)
		}

		categoryIDs, err := seedCategories(txApp, catCol, householdID)
		if err != nil {
			return err
		}
		if err := seedSubCategories(txApp, subCol, householdID, categoryIDs); err != nil {
			return err
		}
		return seedWallets(txApp, walletCol, householdID)
	})
}

func seedCategories(app core.App, col *core.Collection, householdID string) (map[string]string, error) {
	ids := make(map[string]string, len(IncomeCategorySeeds)+len(ExpenseCategorySeeds))

	all := make([]struct {
		seed CategorySeed
		kind string
	}, 0, len(IncomeCategorySeeds)+len(ExpenseCategorySeeds))

	for _, s := range IncomeCategorySeeds {
		all = append(all, struct {
			seed CategorySeed
			kind string
		}{s, "income"})
	}
	for _, s := range ExpenseCategorySeeds {
		all = append(all, struct {
			seed CategorySeed
			kind string
		}{s, "expense"})
	}

	for _, item := range all {
		existing, err := findOneByName(app, col, householdID, item.seed.Name)
		if err != nil {
			return nil, err
		}
		if existing != nil {
			ids[item.seed.Name] = existing.Id
			continue
		}

		rec := core.NewRecord(col)
		rec.Set("name", item.seed.Name)
		rec.Set("type", item.kind)
		rec.Set("icon", item.seed.Icon)
		rec.Set("color", item.seed.Color)
		rec.Set("is_archived", false)
		rec.Set("household_id", householdID)

		if err := app.Save(rec); err != nil {
			return nil, fmt.Errorf("seed kategori %q: %w", item.seed.Name, err)
		}
		ids[item.seed.Name] = rec.Id
	}

	return ids, nil
}

func seedSubCategories(app core.App, col *core.Collection, householdID string, categoryIDs map[string]string) error {
	for _, s := range SubCategorySeeds {
		parentID, ok := categoryIDs[s.Parent]
		if !ok {
			slog.Warn("sub-kategori dilewati, induk tidak ada", "parent", s.Parent, "name", s.Name)
			continue
		}

		existing, err := findOneByName(app, col, householdID, s.Name)
		if err != nil {
			return err
		}
		if existing != nil {
			continue
		}

		rec := core.NewRecord(col)
		rec.Set("name", s.Name)
		rec.Set("category", parentID)
		rec.Set("icon", s.Icon)
		rec.Set("is_archived", false)
		rec.Set("household_id", householdID)

		if err := app.Save(rec); err != nil {
			return fmt.Errorf("seed sub-kategori %q: %w", s.Name, err)
		}
	}

	return nil
}

func seedWallets(app core.App, col *core.Collection, householdID string) error {
	for _, w := range WalletSeeds {
		existing, err := findOneByName(app, col, householdID, w.Name)
		if err != nil {
			return err
		}
		if existing != nil {
			continue
		}

		rec := core.NewRecord(col)
		rec.Set("name", w.Name)
		rec.Set("type", w.Type)
		rec.Set("icon", w.Icon)
		rec.Set("color", w.Color)
		rec.Set("initial_balance", 0)
		rec.Set("balance", 0)
		rec.Set("include_in_networth", w.IncludeInWorth)
		rec.Set("is_archived", false)
		rec.Set("household_id", householdID)

		if err := app.Save(rec); err != nil {
			return fmt.Errorf("seed dompet %q: %w", w.Name, err)
		}
	}

	return nil
}

// findOneByName mencari satu record milik household berdasarkan nama.
func findOneByName(app core.App, col *core.Collection, householdID, name string) (*core.Record, error) {
	records, err := app.FindRecordsByFilter(
		col.Id,
		`household_id = {:household} && name = {:name}`,
		"-created",
		1,
		0,
		map[string]any{"household": householdID, "name": name},
	)
	if err != nil {
		return nil, fmt.Errorf("cari %s %q: %w", col.Name, name, err)
	}
	if len(records) == 0 {
		return nil, nil
	}
	return records[0], nil
}

// EnsureSeeded dipakai oleh command seed manual untuk mengisi household yang
// belum punya kategori/dompet, tanpa merusak data yang sudah ada.
func EnsureSeeded(ctx context.Context, app core.App, householdID string) error {
	return SeedHousehold(app, householdID)
}
