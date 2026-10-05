package services

import (
	"context"
	"fmt"

	"sintya-finance/backend/internal/collections"
)

// NetWorth merangkum posisi keuangan bersih household.
type NetWorth struct {
	Assets       float64 `json:"assets"`
	Liabilities  float64 `json:"liabilities"`
	Net          float64 `json:"net"`
	CashTotal    float64 `json:"cash_total"`
	WalletCount  int     `json:"wallet_count"`
	DebtCount    int     `json:"debt_count"`
	DebtProgress float64 `json:"debt_progress"`
}

// GetNetWorth menghitung total aset, utang, dan selisihnya.
//
// Dompet kartu kredit diperlakukan sebagai liabilitas: saldo negatif pada
// dompet tersebut berarti utang outstanding. Dompet lain dengan saldo negatif
// (mis. overdraft) juga dihitung sebagai liabilitas agar perhitungan tetap
// konservatif.
func GetNetWorth(ctx context.Context, store Store, householdID string) (*NetWorth, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if householdID == "" {
		return nil, fmt.Errorf("networth: householdID wajib diisi")
	}

	wallets, err := store.FindRecordsByFilter(
		collections.ColWallets,
		`household_id = {:h} && is_archived = false && include_in_networth = true`,
		"name", 0, 0,
		map[string]any{"h": householdID},
	)
	if err != nil {
		return nil, fmt.Errorf("networth: ambil dompet: %w", err)
	}

	out := &NetWorth{WalletCount: len(wallets)}

	for _, w := range wallets {
		balance := w.GetFloat("balance")
		switch {
		case balance >= 0:
			out.Assets += balance
		default:
			out.Liabilities += -balance
		}
	}

	debts, err := store.FindRecordsByFilter(
		collections.ColDebts,
		`household_id = {:h} && status != "paid"`,
		"creditor", 0, 0,
		map[string]any{"h": householdID},
	)
	if err != nil {
		return nil, fmt.Errorf("networth: ambil utang: %w", err)
	}

	out.DebtCount = len(debts)

	principal, paid := 0.0, 0.0
	for _, d := range debts {
		p := d.GetFloat("principal")
		b := d.GetFloat("current_balance")
		if b == 0 && p > 0 {
			b = p
		}
		out.Liabilities += b
		principal += p
		paid += p - b
	}

	if principal > 0 {
		out.DebtProgress = round2(paid / principal * 100)
	}

	out.Net = out.Assets - out.Liabilities
	out.CashTotal = out.Assets

	return out, nil
}

// CategoryBreakdown menghitung komposisi pengeluaran per kategori dalam periode.
type CategoryBreakdown struct {
	Total  float64            `json:"total"`
	Items  []CategoryItem     `json:"items"`
	ByType map[string]float64 `json:"by_type"`
}

// CategoryItem adalah satu baris komposisi kategori.
type CategoryItem struct {
	CategoryID string  `json:"category_id"`
	Name       string  `json:"name"`
	Icon       string  `json:"icon"`
	Color      string  `json:"color"`
	Total      float64 `json:"total"`
	Percent    float64 `json:"percent"`
	Count      int     `json:"count"`
}

// GetCategoryBreakdown menghitung pengeluaran (dan pemasukan bila diminta)
// per kategori untuk satu periode. Transfer dan setoran tabungan dilewati
// karena keduanya bukan pengeluaran dan tidak punya kategori.
func GetCategoryBreakdown(ctx context.Context, store Store, householdID, start, end, kind string) (*CategoryBreakdown, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	txs, err := fetchTransactions(ctx, store, householdID, start, end)
	if err != nil {
		return nil, err
	}

	if kind != "income" && kind != "expense" {
		kind = "expense"
	}

	totals := make(map[string]float64)
	counts := make(map[string]int)
	byType := map[string]float64{"income": 0, "expense": 0}

	for _, rec := range txs {
		t := rec.GetString("type")
		if t == "transfer" || IsSavingsContribution(rec) {
			continue
		}
		amount := rec.GetFloat("amount")
		byType[t] += amount

		if t != kind {
			continue
		}
		cat := rec.GetString("category")
		if cat == "" {
			cat = "__uncategorized__"
		}
		totals[cat] += amount
		counts[cat]++
	}

	meta, err := allCategoryMeta(store, householdID)
	if err != nil {
		return nil, err
	}

	out := &CategoryBreakdown{
		ByType: byType,
		Items:  make([]CategoryItem, 0, len(totals)),
	}

	for cat, total := range totals {
		out.Total += total

		item := CategoryItem{CategoryID: cat, Total: total, Count: counts[cat]}
		if cat == "__uncategorized__" {
			item.Name = "Tanpa Kategori"
			item.Color = "gray"
		} else if m, ok := meta[cat]; ok {
			item.Name = m.name
			item.Icon = m.icon
			item.Color = m.color
		} else {
			item.Name = "Dihapus"
		}
		out.Items = append(out.Items, item)
	}

	for i := range out.Items {
		if out.Total > 0 {
			out.Items[i].Percent = round2(out.Items[i].Total / out.Total * 100)
		}
	}

	sortItemsByTotal(out.Items)

	return out, nil
}

type metaInfo struct {
	name  string
	icon  string
	color string
}

func allCategoryMeta(store Store, householdID string) (map[string]metaInfo, error) {
	records, err := store.FindRecordsByFilter(
		collections.ColCategories,
		`household_id = {:h}`,
		"name", 0, 0,
		map[string]any{"h": householdID},
	)
	if err != nil {
		return nil, fmt.Errorf("kategori: %w", err)
	}

	out := make(map[string]metaInfo, len(records))
	for _, rec := range records {
		out[rec.Id] = metaInfo{
			name:  rec.GetString("name"),
			icon:  rec.GetString("icon"),
			color: rec.GetString("color"),
		}
	}
	return out, nil
}

func sortItemsByTotal(items []CategoryItem) {
	for i := 1; i < len(items); i++ {
		for j := i; j > 0 && items[j].Total > items[j-1].Total; j-- {
			items[j], items[j-1] = items[j-1], items[j]
		}
	}
}
