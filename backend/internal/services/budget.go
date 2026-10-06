package services

import (
	"context"
	"fmt"
	"sort"

	"sintya-finance/backend/internal/collections"
)

// BudgetStatus compares realisasi pengeluaran terhadap pagu yang ditetapkan.
type BudgetStatus struct {
	ID         string  `json:"id"`
	Month      string  `json:"month"`
	CategoryID string  `json:"category_id"`
	Category   string  `json:"category"`
	Icon       string  `json:"icon"`
	Color      string  `json:"color"`
	Limit      float64 `json:"limit"`
	Spent      float64 `json:"spent"`
	Remaining  float64 `json:"remaining"`
	Percent    float64 `json:"percent"`
	Percentage float64 `json:"percentage"`
	Over       bool    `json:"over"`
	Status     string  `json:"status"`
}

// BudgetOverview adalah gabungan seluruh status budget sebuah bulan.
type BudgetOverview struct {
	Month           string         `json:"month"`
	TotalLimit      float64        `json:"total_limit"`
	TotalLimitCamel float64        `json:"totalLimit"`
	TotalSpent      float64        `json:"total_spent"`
	TotalSpentCamel float64        `json:"totalSpent"`
	Remaining       float64        `json:"remaining"`
	Items           []BudgetStatus `json:"items"`
}

// GetBudget menghitung realisasi tiap kategori terhadap pagu bulan berjalan.
// Pagu yang belum ditetapkan ikut dilaporkan dengan limit 0 supaya UI bisa
// menandai kategori yang belum ada anggarannya.
func GetBudget(ctx context.Context, store Store, householdID, month string) (*BudgetOverview, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if _, _, err := MonthRange(month); err != nil {
		return nil, err
	}

	start, end, _ := MonthRange(month)

	budgets, err := store.FindRecordsByFilter(
		collections.ColBudgets,
		`household_id = {:h} && month = {:m}`,
		"amount", 0, 0,
		map[string]any{"h": householdID, "m": month},
	)
	if err != nil {
		return nil, fmt.Errorf("budget: ambil pagu: %w", err)
	}

	txs, err := fetchTransactions(ctx, store, householdID, start, end)
	if err != nil {
		return nil, err
	}

	spentByCategory := make(map[string]float64)
	for _, rec := range txs {
		if rec.GetString("type") != "expense" {
			continue
		}
		cat := rec.GetString("category")
		if cat == "" {
			continue
		}
		spentByCategory[cat] += rec.GetFloat("amount")
	}

	names, err := categoryNames(store, householdID)
	if err != nil {
		return nil, err
	}

	out := &BudgetOverview{Month: month, Items: make([]BudgetStatus, 0, len(budgets))}

	seen := make(map[string]struct{}, len(budgets))
	for _, b := range budgets {
		cat := b.GetString("category")
		spent := spentByCategory[cat]
		limit := b.GetFloat("amount")

		pct := percent(spent, limit)
		status := "safe"
		if pct > 100 {
			status = "over"
		} else if pct >= 80 {
			status = "warning"
		}

		item := BudgetStatus{
			ID:         cat,
			Month:      month,
			CategoryID: cat,
			Category:   names[cat],
			Limit:      limit,
			Spent:      spent,
			Remaining:  limit - spent,
			Percent:    pct,
			Percentage: pct,
			Over:       spent > limit && limit > 0,
			Status:     status,
		}
		if meta, ok := categoryMeta(store, householdID, cat); ok {
			item.Icon = meta.icon
			item.Color = meta.color
		}

		out.Items = append(out.Items, item)
		out.TotalLimit += limit
		out.TotalSpent += spent
		seen[cat] = struct{}{}
	}

	// Kategori yang sudah belanja bulan ini tapi belum punya pagu.
	overCats := make([]string, 0, len(spentByCategory))
	for cat := range spentByCategory {
		if _, ok := seen[cat]; !ok {
			overCats = append(overCats, cat)
		}
	}
	sort.Strings(overCats)

	for _, cat := range overCats {
		spent := spentByCategory[cat]
		item := BudgetStatus{
			ID:         cat,
			Month:      month,
			CategoryID: cat,
			Category:   names[cat],
			Spent:      spent,
			Remaining:  -spent,
			Percent:    100,
			Percentage: 100,
			Over:       true,
			Status:     "over",
		}
		if meta, ok := categoryMeta(store, householdID, cat); ok {
			item.Icon = meta.icon
			item.Color = meta.color
		}
		out.Items = append(out.Items, item)
		out.TotalSpent += spent
	}

	sort.Slice(out.Items, func(i, j int) bool {
		a, b := out.Items[i], out.Items[j]
		if a.Over != b.Over {
			return a.Over
		}
		return a.Percent > b.Percent
	})

	out.TotalLimitCamel = out.TotalLimit
	out.TotalSpentCamel = out.TotalSpent
	out.Remaining = out.TotalLimit - out.TotalSpent

	return out, nil
}

type catMeta struct {
	icon  string
	color string
}

// categoryNames memetakan id kategori ke nama untuk ditampilkan.
func categoryNames(store Store, householdID string) (map[string]string, error) {
	records, err := store.FindRecordsByFilter(
		collections.ColCategories,
		`household_id = {:h}`,
		"name", 0, 0,
		map[string]any{"h": householdID},
	)
	if err != nil {
		return nil, fmt.Errorf("budget: ambil kategori: %w", err)
	}

	out := make(map[string]string, len(records))
	for _, rec := range records {
		out[rec.Id] = rec.GetString("name")
	}
	return out, nil
}

// categoryMeta mengambil icon & color untuk satu kategori.
func categoryMeta(store Store, householdID, categoryID string) (catMeta, bool) {
	if categoryID == "" {
		return catMeta{}, false
	}
	filter := `id = {:c}`
	params := map[string]any{"c": categoryID}
	if householdID != "" {
		filter = `household_id = {:h} && id = {:c}`
		params["h"] = householdID
	}
	records, err := store.FindRecordsByFilter(
		collections.ColCategories,
		filter,
		"", 1, 0,
		params,
	)
	if err != nil || len(records) == 0 {
		return catMeta{}, false
	}
	return catMeta{
		icon:  records[0].GetString("icon"),
		color: records[0].GetString("color"),
	}, true
}

// percent menghitung persentase pemakaian pagu. Pagu nol dianggap 100% agar UI
// tidak menampilkan NaN.
func percent(spent, limit float64) float64 {
	if limit <= 0 {
		if spent > 0 {
			return 100
		}
		return 0
	}
	return round2(spent / limit * 100)
}

func round2(v float64) float64 {
	return float64(int64(v*100+0.5)) / 100
}
