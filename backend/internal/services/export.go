package services

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"strings"

	"github.com/pocketbase/pocketbase/core"

	"sintya-finance/backend/internal/collections"
)

// ExportPayload adalah bentuk umum hasil ekspor yang dipakai baik untuk JSON
// maupun backup lengkap (restore).
type ExportPayload struct {
	Version     int                 `json:"version"`
	ExportedAt  string              `json:"exported_at"`
	HouseholdID string              `json:"household_id"`
	Collections map[string][]Record `json:"collections"`
	Meta        map[string]int      `json:"meta"`
}

// Record adalah representasiagnostic dari satu record PocketBase.
type Record map[string]any

// ExportableCollections adalah daftar koleksi yang ikut diekspor, urut dari
// yang paling dependedensikan.
var ExportableCollections = []string{
	collections.ColCategories,
	collections.ColSubCategories,
	collections.ColWallets,
	collections.ColSavings,
	collections.ColDebts,
	collections.ColTransactions,
	collections.ColDebtPayments,
	collections.ColBudgets,
}

// SystemFields tidak ikut diekspor karena dibuat ulang oleh PocketBase.
//
// `id` sengaja TIDAK ada di sini. Id lama wajib ikut tersimpan supaya restore
// bisa memetakan ulang setiap relation (wallet, category, to_wallet, dst.) ke id
// baru milik household tujuan; writer.insert sudah otomatis melewati kolom id
// ketika membuat record baru.
var SystemFields = map[string]struct{}{
	"created":      {},
	"updated":      {},
	"collectionId": {},
	"collection":   {},
	"expand":       {},
}

// ExportJSON menyusun seluruh data household ke dalam satu struktur JSON.
func ExportJSON(ctx context.Context, store Store, householdID string) (*ExportPayload, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if householdID == "" {
		return nil, fmt.Errorf("export: householdID wajib diisi")
	}

	out := &ExportPayload{
		Version:     1,
		ExportedAt:  nowUTC(),
		HouseholdID: householdID,
		Collections: make(map[string][]Record, len(ExportableCollections)),
		Meta:        make(map[string]int, len(ExportableCollections)),
	}

	for _, name := range ExportableCollections {
		records, err := store.FindRecordsByFilter(
			name,
			`household_id = {:h}`,
			"created", 0, 0,
			map[string]any{"h": householdID},
		)
		if err != nil {
			return nil, fmt.Errorf("export %s: %w", name, err)
		}

		rows := make([]Record, 0, len(records))
		for _, rec := range records {
			rows = append(rows, toRecord(rec))
		}

		out.Collections[name] = rows
		out.Meta[name] = len(rows)
	}

	return out, nil
}

// ToJSON menulis payload ekspor sebagai JSON indented.
func ToJSON(w io.Writer, payload *ExportPayload) error {
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	enc.SetEscapeHTML(false)
	return enc.Encode(payload)
}

// TransactionsToCSV menulis transaksi sebagai CSV siap diimpor ke Excel/Sheets.
// Kolom relation diekspand ke nama agar file tetap terbaca manusia.
func TransactionsToCSV(ctx context.Context, store Store, householdID, start, end string) ([]byte, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	records, err := fetchTransactions(ctx, store, householdID, start, end)
	if err != nil {
		return nil, err
	}

	names, err := lookupNames(store, householdID)
	if err != nil {
		return nil, err
	}

	var sb strings.Builder
	sb.WriteString("\xef\xbb\xbf")
	w := csv.NewWriter(&sb)

	header := []string{
		"Tanggal", "Tipe", "Kategori", "Sub Kategori",
		"Dompet", "Dompet Tujuan", "Nominal", "Catatan", "Target Tabungan",
	}
	if err := w.Write(header); err != nil {
		return nil, fmt.Errorf("csv header: %w", err)
	}

	for _, rec := range records {
		row := []string{
			dayKey(rec.GetString("date")),
			rec.GetString("type"),
			names[rec.GetString("category")],
			names[rec.GetString("sub_category")],
			names[rec.GetString("wallet")],
			names[rec.GetString("to_wallet")],
			formatAmount(rec.GetFloat("amount")),
			rec.GetString("note"),
			names[rec.GetString("savings_goal")],
		}
		if err := w.Write(row); err != nil {
			return nil, fmt.Errorf("csv row: %w", err)
		}
	}

	w.Flush()
	if err := w.Error(); err != nil {
		return nil, fmt.Errorf("csv flush: %w", err)
	}

	return []byte(sb.String()), nil
}

// lookupNames memetakan id ke nama untuk collections yang sering direferensikan.
func lookupNames(store Store, householdID string) (map[string]string, error) {
	out := make(map[string]string)

	sources := []struct {
		collection string
		field      string
	}{
		{collections.ColCategories, "name"},
		{collections.ColSubCategories, "name"},
		{collections.ColWallets, "name"},
		{collections.ColSavings, "name"},
	}

	for _, src := range sources {
		records, err := store.FindRecordsByFilter(
			src.collection,
			`household_id = {:h}`,
			"", 0, 0,
			map[string]any{"h": householdID},
		)
		if err != nil {
			continue
		}
		for _, rec := range records {
			out[rec.Id] = rec.GetString(src.field)
		}
	}

	return out, nil
}

func toRecord(rec *core.Record) Record {
	raw := rec.FieldsData()
	out := make(Record, len(raw)+1)

	// Id lama disimpan di bawah key `id` supaya restore bisa memetakan relation.
	out["id"] = rec.Id

	for k, v := range raw {
		if _, skip := SystemFields[k]; skip {
			continue
		}
		out[k] = v
	}

	return out
}

// formatAmount memakai format Indonesia: titik ribuan, koma desimal.
func formatAmount(v float64) string {
	neg := v < 0
	if neg {
		v = -v
	}

	s := fmt.Sprintf("%.2f", v)
	dot := strings.IndexByte(s, '.')
	intPart, frac := s[:dot], s[dot:]

	var grouped []byte
	for i, r := range []byte(intPart) {
		if i > 0 && (len(intPart)-i)%3 == 0 {
			grouped = append(grouped, '.')
		}
		grouped = append(grouped, r)
	}

	out := string(grouped) + "," + frac[1:]
	if neg {
		out = "-" + out
	}
	return out
}
