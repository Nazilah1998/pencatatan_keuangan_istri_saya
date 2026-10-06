package services

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"

	"sintya-finance/backend/internal/collections"
)

// Store adalah subset core.App yang dipakai service untuk membaca data.
// Semua perhitungan bisnis melewati antarmuka ini, bukan langsung ke PocketBase.
type Store interface {
	FindCachedCollectionByNameOrId(nameOrId string) (*core.Collection, error)
	FindRecordsByFilter(collectionModelOrIdentifier any, filter string, sort string, limit int, offset int, params ...dbx.Params) ([]*core.Record, error)
}

// Cashflow merangkum arus kas dalam satu rentang tanggal.
type Cashflow struct {
	PeriodStart string  `json:"period_start"`
	PeriodEnd   string  `json:"period_end"`
	Income      float64 `json:"income"`
	Expense     float64 `json:"expense"`
	Transfer    float64 `json:"transfer"`
	Net         float64 `json:"net"`
	TxCount     int     `json:"tx_count"`
	Daily       []Daily `json:"daily"`
}

// Daily adalah ringkasan satu hari untuk grafik.
type Daily struct {
	Date     string  `json:"date"`
	Income   float64 `json:"income"`
	Expense  float64 `json:"expense"`
	Transfer float64 `json:"transfer"`
	Net      float64 `json:"net"`
}

// GetCashflow menghitung arus kas household dalam rentang tanggal tertentu.
// Transfer tidak dihitung sebagai income maupun expense karena hanya memindah
// uang antar dompet milik sendiri.
func GetCashflow(ctx context.Context, store Store, householdID, start, end string) (*Cashflow, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if householdID == "" {
		return nil, fmt.Errorf("cashflow: householdID wajib diisi")
	}

	records, err := fetchTransactions(ctx, store, householdID, start, end)
	if err != nil {
		return nil, err
	}

	out := &Cashflow{
		PeriodStart: start,
		PeriodEnd:   end,
		Daily:       make([]Daily, 0, len(records)),
	}

	byDay := make(map[string]*Daily)

	for _, rec := range records {
		amount := rec.GetFloat("amount")
		day := dayKey(rec.GetString("date"))

		d, ok := byDay[day]
		if !ok {
			d = &Daily{Date: day}
			byDay[day] = d
		}

		switch rec.GetString("type") {
		case "income":
			out.Income += amount
			d.Income += amount
		case "expense":
			// Setoran tabungan bukan pengeluaran, melainkan perpindahan uang
			// dari dompet ke target, jadi ikut dihitung sebagai transfer.
			if IsSavingsContribution(rec) {
				out.Transfer += amount
				d.Transfer += amount
				break
			}

			out.Expense += amount
			d.Expense += amount
		case "transfer":
			out.Transfer += amount
			d.Transfer += amount
		}

		out.TxCount++
	}

	out.Net = out.Income - out.Expense

	// Slice disusun setelah map terisi supaya setiap elemen memakai nilai
	// akhirnya, bukan salinan kosong saat hari pertama ditemukan.
	out.Daily = make([]Daily, 0, len(byDay))
	for _, d := range byDay {
		d.Net = d.Income - d.Expense
		out.Daily = append(out.Daily, *d)
	}

	sort.Slice(out.Daily, func(i, j int) bool { return out.Daily[i].Date < out.Daily[j].Date })

	return out, nil
}

// fetchTransactions mengambil seluruh transaksi household pada rentang tanggal.
// PocketBase menyimpan date sebagai string "YYYY-MM-DD HH:MM:SS.sssZ", sehingga
// perbandingan dilakukan pada 10 karakter pertama.
func fetchTransactions(ctx context.Context, store Store, householdID, start, end string) ([]*core.Record, error) {
	filter := `household_id = {:h} && date >= {:s} && date <= {:e}`
	params := map[string]any{
		"h": householdID,
		"s": normalizeBoundary(start, false),
		"e": normalizeBoundary(end, true),
	}

	records, err := store.FindRecordsByFilter(collections.ColTransactions, filter, "date", 0, 0, params)
	if err != nil {
		return nil, fmt.Errorf("cashflow: ambil transaksi: %w", err)
	}

	if err := ctx.Err(); err != nil {
		return nil, err
	}

	return records, nil
}

// normalizeBoundary mengubah "2026-01-31" atau "2026-01" menjadi batas perbandingan yang benar.
func normalizeBoundary(day string, upper bool) string {
	day = strings.TrimSpace(day)
	if len(day) == 7 {
		if upper {
			t, err := time.Parse("2006-01", day)
			if err == nil {
				end := t.AddDate(0, 1, -1).Format("2006-01-02")
				return end + " 23:59:59.999Z"
			}
		} else {
			return day + "-01 00:00:00.000Z"
		}
	}
	if len(day) < 10 {
		return day
	}
	if upper {
		return day[:10] + " 23:59:59.999Z"
	}
	return day[:10] + " 00:00:00.000Z"
}

func dayKey(raw string) string {
	if len(raw) < 10 {
		return raw
	}
	return raw[:10]
}

// MonthRange mengembalikan rentang tanggal ISO untuk sebuah bulan ("2026-01").
func MonthRange(month string) (string, string, error) {
	t, err := time.Parse("2006-01", strings.TrimSpace(month))
	if err != nil {
		return "", "", fmt.Errorf("format bulan harus YYYY-MM: %w", err)
	}
	start := t.Format("2006-01-02")
	end := t.AddDate(0, 1, -1).Format("2006-01-02")
	return start, end, nil
}
