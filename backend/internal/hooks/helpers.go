package hooks

import (
	"fmt"

	"github.com/pocketbase/pocketbase/core"
)

// allIDs mengembalikan seluruh id record pada satu koleksi.
func allIDs(app core.App, collectionName string) ([]string, error) {
	col, err := app.FindCachedCollectionByNameOrId(collectionName)
	if err != nil {
		return nil, fmt.Errorf("cari koleksi %s: %w", collectionName, err)
	}

	records, err := app.FindAllRecords(col.Id)
	if err != nil {
		return nil, fmt.Errorf("ambil semua %s: %w", collectionName, err)
	}

	ids := make([]string, 0, len(records))
	for _, rec := range records {
		ids = append(ids, rec.Id)
	}
	return ids, nil
}

// findByID memuat satu record beserta household_id-nya.
func findByID(app core.App, collectionName, id string) (*core.Record, error) {
	col, err := app.FindCachedCollectionByNameOrId(collectionName)
	if err != nil {
		return nil, fmt.Errorf("cari koleksi %s: %w", collectionName, err)
	}
	return app.FindRecordById(col.Id, id)
}
