package services

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"

	"sintya-finance/backend/internal/collections"
)

// RestorePayload adalah bentuk JSON yang dihasilkan oleh ExportJSON.
type RestorePayload struct {
	Version     int                 `json:"version"`
	HouseholdID string              `json:"household_id"`
	Collections map[string][]Record `json:"collections"`
}

// Validate memeriksa bahwa payload restaurer valid sebelum menyentuh database.
func (p *RestorePayload) Validate() error {
	if p == nil {
		return errors.New("restore: payload kosong")
	}
	if p.Version != 1 {
		return fmt.Errorf("restore: versi payload tidak didukung: %d", p.Version)
	}
	if len(p.Collections) == 0 {
		return errors.New("restore: tidak ada koleksi dalam payload")
	}
	for _, name := range ExportableCollections {
		if _, ok := p.Collections[name]; !ok {
			return fmt.Errorf("restore: koleksi %q tidak ada di payload", name)
		}
	}
	return nil
}

// RestoreWriter adalah bagian dari core.App yang dibutuhkan untuk menyimpan
// record. Dipisah agar service bisa diuji tanpa PocketBase penuh.
type RestoreWriter interface {
	RunInTransaction(f func(txApp core.App) error) error
	FindCachedCollectionByNameOrId(nameOrId string) (*core.Collection, error)
	FindRecordsByFilter(collectionModelOrIdentifier any, filter string, sort string, limit int, offset int, params ...dbx.Params) ([]*core.Record, error)
	Save(model core.Model) error
	Delete(model core.Model) error
}

// RestoreResult merangkum hasil restore.
type RestoreResult struct {
	Created int            `json:"created"`
	Skipped int            `json:"skipped"`
	PerColl map[string]int `json:"per_collection"`
}

// Restore inserting seluruh data dari payload ke household tujuan.
//
// Id dari payload sengaja dibuang: PocketBase akan membuat id baru agar tidak
// bentrok dengan data yang sudah ada. Record yang dicocokkan berdasarkan kombinasi
// nama + parent tidak diduplikasi.
func Restore(ctx context.Context, app RestoreWriter, householdID string, payload *RestorePayload, replace bool) (*RestoreResult, error) {
	if err := payload.Validate(); err != nil {
		return nil, err
	}
	if householdID == "" {
		return nil, errors.New("restore: household tujuan wajib diisi")
	}

	out := &RestoreResult{PerColl: make(map[string]int, len(ExportableCollections))}

	err := app.RunInTransaction(func(txApp core.App) error {
		w := &writer{app: txApp, householdID: householdID}

		if replace {
			for _, name := range ExportableCollections {
				if err := w.purge(name); err != nil {
					return err
				}
			}
		}

		// Urutan penting: induk harus lebih dulu dibuat agar id anak dapat
		// dipetakan ke id baru milik household tujuan.
		idMap := make(map[string]map[string]string, len(ExportableCollections))

		for _, name := range ExportableCollections {
			mapping := make(map[string]string, len(payload.Collections[name]))
			idMap[name] = mapping

			for _, row := range payload.Collections[name] {
				if err := ctx.Err(); err != nil {
					return err
				}

				rec, created, err := w.insert(name, row, idMap)
				if err != nil {
					return fmt.Errorf("restore %s: %w", name, err)
				}

				if oldID, ok := row["id"].(string); ok && oldID != "" && rec != nil {
					mapping[oldID] = rec.Id
				}

				if created {
					out.Created++
				} else {
					out.Skipped++
				}
			}

			out.PerColl[name] = out.PerColl[name] + len(payload.Collections[name])
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	slog.Info("restore selesai", "created", out.Created, "skipped", out.Skipped)
	return out, nil
}

// writer adalah helper internal untuk proses restore.
type writer struct {
	app         core.App
	householdID string
}

// purge menghapus seluruh record satu koleksi milik household.
func (w *writer) purge(collectionName string) error {
	col, err := w.app.FindCachedCollectionByNameOrId(collectionName)
	if err != nil {
		return fmt.Errorf("cari koleksi %s: %w", collectionName, err)
	}

	records, err := w.app.FindRecordsByFilter(col.Id, `household_id = {:h}`, "", 0, 0,
		map[string]any{"h": w.householdID})
	if err != nil {
		return fmt.Errorf("hapus %s: %w", collectionName, err)
	}

	for _, rec := range records {
		if err := w.app.Delete(rec); err != nil {
			return fmt.Errorf("hapus record %s: %w", rec.Id, err)
		}
	}

	return nil
}

// relationFields menerima daftar field yang perlu dipetakan ulang ke id baru.
var relationFields = map[string][]string{
	collections.ColSubCategories: {"category"},
	collections.ColTransactions:  {"category", "sub_category", "wallet", "to_wallet", "savings_goal"},
	collections.ColBudgets:       {"category"},
	collections.ColDebtPayments:  {"debt", "wallet"},
}

// uniqueKey menentukan field yang dipakai untuk mengenali record yang sudah ada.
var uniqueKey = map[string]struct {
	match []string
}{
	collections.ColCategories:    {match: []string{"name"}},
	collections.ColSubCategories: {match: []string{"name", "category"}},
	collections.ColWallets:       {match: []string{"name"}},
	collections.ColSavings:       {match: []string{"name"}},
	collections.ColDebts:         {match: []string{"creditor"}},
}

// insert membuat satu record dari baris payload. Record yang sudah ada
// dikembalikan apa adanya dengan created=false.
func (w *writer) insert(
	collectionName string,
	row Record,
	idMap map[string]map[string]string,
) (*core.Record, bool, error) {
	col, err := w.app.FindCachedCollectionByNameOrId(collectionName)
	if err != nil {
		return nil, false, fmt.Errorf("cari koleksi %s: %w", collectionName, err)
	}

	if key, ok := uniqueKey[collectionName]; ok {
		existing, err := w.findDuplicate(col, row, key.match, idMap)
		if err != nil {
			return nil, false, err
		}
		if existing != nil {
			return existing, false, nil
		}
	}

	rec := core.NewRecord(col)

	for field, value := range row {
		if field == "id" {
			continue
		}
		rec.Set(field, remapRelationValue(collectionName, field, value, idMap))
	}

	rec.Set("household_id", w.householdID)

	if err := w.app.Save(rec); err != nil {
		return nil, false, fmt.Errorf("simpan record: %w", err)
	}

	return rec, true, nil
}

// remapRelationValue mengganti id lama pada field relation dengan id baru dari
// household tujuan. Nilai non-string (mis. slice) dipetakan elemen per elemen.
func remapRelationValue(collectionName, field string, value any, idMap map[string]map[string]string) any {
	fields, ok := relationFields[collectionName]
	if !ok {
		return value
	}

	isRelation := false
	for _, f := range fields {
		if f == field {
			isRelation = true
			break
		}
	}
	if !isRelation {
		return value
	}

	switch v := value.(type) {
	case string:
		return lookupMapped(v, idMap)
	case []string:
		out := make([]string, 0, len(v))
		for _, s := range v {
			out = append(out, lookupMapped(s, idMap))
		}
		return out
	case []any:
		out := make([]any, 0, len(v))
		for _, item := range v {
			if s, isStr := item.(string); isStr {
				out = append(out, lookupMapped(s, idMap))
				continue
			}
			out = append(out, item)
		}
		return out
	default:
		return value
	}
}

// lookupMapped mencoba memetakan id lama ke id baru pada semua koleksi.
func lookupMapped(oldID string, idMap map[string]map[string]string) string {
	if oldID == "" {
		return oldID
	}
	for _, mapping := range idMap {
		if newID, ok := mapping[oldID]; ok && newID != "" {
			return newID
		}
	}
	// Id lama tidak dipetakan: biarkan kosong agar relasi tidak menunjuk
	// record milik household lain.
	return ""
}

// findDuplicate mencari record yang sudah ada berdasarkan kombinasi field.
func (w *writer) findDuplicate(col *core.Collection, row Record, fields []string, idMap map[string]map[string]string) (*core.Record, error) {
	if len(fields) == 0 {
		return nil, nil
	}

	existing, err := w.app.FindRecordsByFilter(
		col.Id,
		`household_id = {:h}`,
		"created", 0, 0,
		map[string]any{"h": w.householdID},
	)
	if err != nil {
		return nil, fmt.Errorf("cek duplikat %s: %w", col.Name, err)
	}

	for _, rec := range existing {
		match := true
		for _, f := range fields {
			want := row[f]
			if s, ok := want.(string); ok {
				want = lookupMapped(s, idMap)
			}
			if fmt.Sprint(want) != fmt.Sprint(rec.Get(f)) {
				match = false
				break
			}
		}
		if match {
			return rec, nil
		}
	}

	return nil, nil
}
