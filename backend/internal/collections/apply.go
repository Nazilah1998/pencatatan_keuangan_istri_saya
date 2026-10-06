package collections

import (
	"database/sql"
	"errors"
	"fmt"
	"log/slog"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

// Result merangkum apa yang terjadi pada satu koleksi saat Apply dijalankan.
type Result struct {
	Name   string
	Action string
	Detail string
}

const (
	ActionCreated   = "created"
	ActionUnchanged = "unchanged"
	ActionUpdated   = "updated"
)

// Apply membuat atau menyelaraskan seluruh koleksi terhadap definitions.go.
//
// Sifatnya idempotent: menjalankannya berkali-kali aman dan tidak menghapus data.
//   - Koleksi yang belum ada dibuat baru.
//   - Koleksi yang ada diperbarui: rules dan index diselaraskan, field baru
//     ditambahkan, opsi select di-union. Field yang sudah ada tidak pernah
//     dihapus agar data pengguna tidak hilang.
func Apply(app core.App) ([]Result, error) {
	var results []Result

	for _, desired := range All() {
		// PocketBase v0.40 memvalidasi relation terhadap Id koleksi, bukan
		// nama. Nama harus diubah lebih dulu, kecuali untuk self-reference
		// yang belum punya Id karena koleksinya baru dibuat.
		resolveRelations(app, desired)

		existing, err := app.FindCollectionByNameOrId(desired.Name)

		switch {
		case errors.Is(err, sql.ErrNoRows):
			if err := app.Save(desired); err != nil {
				return nil, fmt.Errorf("buat koleksi %s: %w", desired.Name, err)
			}
			results = append(results, Result{
				Name:   desired.Name,
				Action: ActionCreated,
				Detail: fmt.Sprintf("%d field, %d index", len(desired.Fields), len(desired.Indexes)),
			})

		case err != nil:
			return nil, fmt.Errorf("cari koleksi %s: %w", desired.Name, err)

		default:
			merged, changed := merge(existing, desired)
			if !changed {
				results = append(results, Result{Name: desired.Name, Action: ActionUnchanged})
				continue
			}
			if err := app.Save(merged); err != nil {
				return nil, fmt.Errorf("perbarui koleksi %s: %w", desired.Name, err)
			}
			results = append(results, Result{
				Name:   desired.Name,
				Action: ActionUpdated,
				Detail: "schema/rules/index diselaraskan",
			})
		}
	}

	if err := app.ReloadCachedCollections(); err != nil {
		return nil, fmt.Errorf("reload cache koleksi: %w", err)
	}

	return results, nil
}

// resolveRelations mengganti nama koleksi pada relation field dengan Id-nya.
//
// Definitions ditulis memakai nama supaya mudah dibaca dan urutan Apply bebas.
// PocketBase sendiri menyimpan relation sebagai Id, jadi nama harus
// diterjemahkan sebelum disimpan. Self-reference memakai Id koleksi itu sendiri
// bila sudah ada; untuk koleksi yang baru dibuat, PB akan menetakkannya saat
// proses create.
func resolveRelations(app core.App, target *core.Collection) {
	for i, field := range target.Fields {
		rel, ok := field.(*core.RelationField)
		if !ok || rel.CollectionId == "" {
			continue
		}

		// Sudah berupa Id (tidak sama dengan nama koleksi manapun) → biarkan.
		if rel.CollectionId == target.Id && !target.IsNew() {
			continue
		}

		if rel.CollectionId == target.Name {
			if !target.IsNew() {
				target.Fields[i] = rel
				rel.CollectionId = target.Id
			}
			continue
		}

		if found, err := app.FindCachedCollectionByNameOrId(rel.CollectionId); err == nil && found != nil {
			target.Fields[i] = rel
			rel.CollectionId = found.Id
		}
	}
}

// merge menyalin definisi yang disintegrasikan ke koleksi existing tanpa
// menghilangkan data. changed melaporkan apakah ada perbedaan yang perlu disimpan.
func merge(existing, desired *core.Collection) (*core.Collection, bool) {
	target := existing
	changed := false

	added, widened := mergeFields(target, desired.Fields)
	if added > 0 || widened {
		changed = true
		slog.Info("field diperbarui", "collection", target.Name, "ditambah", added, "selectDiperluas", widened)
	}

	if !rulesEqual(target, desired) {
		target.ListRule = desired.ListRule
		target.ViewRule = desired.ViewRule
		target.CreateRule = desired.CreateRule
		target.UpdateRule = desired.UpdateRule
		target.DeleteRule = desired.DeleteRule
		target.AuthRule = desired.AuthRule
		target.ManageRule = desired.ManageRule
		changed = true
	}

	if !indexesEqual(target.Indexes, desired.Indexes) {
		target.Indexes = desired.Indexes
		changed = true
	}

	if desired.IsAuth() && !oauth2Equal(target.OAuth2, desired.OAuth2) {
		target.OAuth2 = desired.OAuth2
		changed = true
	}

	return target, changed
}

// mergeFields menambahkan field yang belum ada ke existing. Opsi select di-union
// agar nilai yang sudah terpakai tidak ikut terhapus.
func mergeFields(existing *core.Collection, desired core.FieldsList) (added int, widened bool) {
	for _, want := range desired {
		current := existing.Fields.GetByName(want.GetName())
		if current == nil {
			existing.Fields.Add(want)
			added++
			continue
		}
		if unionSelectValues(current, want) {
			widened = true
		}
	}
	return added, widened
}

// unionSelectValues menggabungkan daftar opsi select dan mengembalikan true bila
// ada nilai baru yang ditambahkan.
func unionSelectValues(current, want core.Field) bool {
	cur, okCur := current.(*core.SelectField)
	wat, okWat := want.(*core.SelectField)
	if !okCur || !okWat {
		return false
	}

	seen := make(map[string]struct{}, len(cur.Values))
	for _, v := range cur.Values {
		seen[v] = struct{}{}
	}

	added := false
	for _, v := range wat.Values {
		if _, dup := seen[v]; dup {
			continue
		}
		cur.Values = append(cur.Values, v)
		seen[v] = struct{}{}
		added = true
	}

	return added
}

func rulesEqual(a, b *core.Collection) bool {
	return ruleStr(a.ListRule) == ruleStr(b.ListRule) &&
		ruleStr(a.ViewRule) == ruleStr(b.ViewRule) &&
		ruleStr(a.CreateRule) == ruleStr(b.CreateRule) &&
		ruleStr(a.UpdateRule) == ruleStr(b.UpdateRule) &&
		ruleStr(a.DeleteRule) == ruleStr(b.DeleteRule) &&
		ruleStr(a.AuthRule) == ruleStr(b.AuthRule) &&
		ruleStr(a.ManageRule) == ruleStr(b.ManageRule)
}

// ruleStr harus membedakan `nil` dari rule kosong.
//
// Di PocketBase `nil` berarti "superuser only", sedangkan pointer ke string
// kosong berarti "publik". Kalau keduanya_disamakan, apply() akan menganggap
// rule publik sudah benar dan tidak pernah memperketat akses.
func ruleStr(v *string) string {
	if v == nil {
		return "\x00nil"
	}
	return "\x00" + *v
}

func indexesEqual(a, b types.JSONArray[string]) bool {
	if len(a) != len(b) {
		return false
	}
	for name, cols := range b {
		if a[name] != cols {
			return false
		}
	}
	return true
}

func oauth2Equal(a, b core.OAuth2Config) bool {
	if a.Enabled != b.Enabled || len(a.Providers) != len(b.Providers) {
		return false
	}
	for i := range a.Providers {
		if a.Providers[i].Name != b.Providers[i].Name ||
			a.Providers[i].ClientId != b.Providers[i].ClientId ||
			a.Providers[i].ClientSecret != b.Providers[i].ClientSecret {
			return false
		}
	}
	return true
}
