package hooks

import (
	"fmt"
	"log/slog"
	"sync"

	"github.com/pocketbase/pocketbase/core"

	"sintya-finance/backend/internal/collections"
)

// onUserCreated membuat entitas household untuk user baru lalu men-seed
// kategori dan dompet default.
//
// Pembuatan household dilakukan di tahap AfterCreate karena Households
// memakai rule "hanya anggota household itu yang boleh akses", sehingga record
// harus benar-benar ada di database sebelum household_id diisi. Kalau
// housekeeping dilakukan di BeforeCreate, record households tidak akan pernah
// terlihat oleh hook yang sama.
func onUserCreated(e *core.RecordEvent) error {
	if e.Record == nil {
		return nil
	}

	userID := e.Record.Id

	err := e.App.RunInTransaction(func(txApp core.App) error {
		householdID, err := ensureHouseholdFor(txApp, userID, e.Record.GetString("language"))
		if err != nil {
			return err
		}

		return collections.SeedHousehold(txApp, householdID)
	})

	if err != nil {
		slog.Error("seed household gagal", "user", userID, "error", err)
		return err
	}

	return nil
}

// ensureHouseholdFor mengembalikan household milik user, membuatnya bila belum
// ada. Idempoten supaya retry hook tidak menghasilkan household ganda.
func ensureHouseholdFor(txApp core.App, userID, language string) (string, error) {
	usersCol, err := txApp.FindCachedCollectionByNameOrId(collections.ColUsers)
	if err != nil {
		return "", fmt.Errorf("cari koleksi users: %w", err)
	}

	user, err := txApp.FindRecordById(usersCol.Id, userID)
	if err != nil {
		return "", fmt.Errorf("muat ulang user: %w", err)
	}

	householdID := user.GetString("household_id")

	if householdID == "" {
		created, err := createHousehold(txApp, userID, language)
		if err != nil {
			return "", err
		}
		householdID = created
	}

	if user.GetString("language") == "" {
		user.Set("language", firstNonEmpty(language, "id"))
		if err := txApp.Save(user); err != nil {
			return "", fmt.Errorf("isi bahasa default: %w", err)
		}
	}

	return householdID, nil
}

// createHousehold membuat satu record households untuk user.
func createHousehold(txApp core.App, userID, language string) (string, error) {
	col, err := txApp.FindCachedCollectionByNameOrId(collections.ColHouseholds)
	if err != nil {
		return "", fmt.Errorf("cari koleksi households: %w", err)
	}

	// Sanity check: jangan sampai ada dua household untuk user yang sama.
	existing, err := txApp.FindFirstRecordByFilter(
		col.Id,
		`created_by = {:u}`,
		map[string]any{"u": userID},
	)
	if err == nil && existing != nil {
		if err := attachHousehold(txApp, userID, existing.Id); err != nil {
			return "", err
		}
		return existing.Id, nil
	}

	rec := core.NewRecord(col)
	rec.Set("name", "Rumah Tangga")
	rec.Set("currency", "IDR")
	rec.Set("language", firstNonEmpty(language, "id"))
	rec.Set("created_by", userID)

	if err := txApp.Save(rec); err != nil {
		return "", fmt.Errorf("buat household: %w", err)
	}

	if err := attachHousehold(txApp, userID, rec.Id); err != nil {
		return "", err
	}

	return rec.Id, nil
}

// attachHousehold menulis household_id ke user.
func attachHousehold(txApp core.App, userID, householdID string) error {
	usersCol, err := txApp.FindCachedCollectionByNameOrId(collections.ColUsers)
	if err != nil {
		return fmt.Errorf("cari koleksi users: %w", err)
	}

	user, err := txApp.FindRecordById(usersCol.Id, userID)
	if err != nil {
		return fmt.Errorf("muat ulang user: %w", err)
	}

	user.Set("household_id", householdID)
	if err := txApp.Save(user); err != nil {
		return fmt.Errorf("isi household_id: %w", err)
	}

	return nil
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

// onUserCreateRequest membersihkan payload signup.
//
// Household tidak pernah dibuat lewat API publik: `households` hanya bisa ditulis
// hook server. Kalau klien boleh mengirim household_id, dia bisa langsung masuk
// ke household orang lain sebelum hook signup berjalan. Karena itu nilainya
// dibuang di sini dan diisi ulang oleh onUserCreated.
func onUserCreateRequest(e *core.RecordRequestEvent) error {
	if e.Record == nil {
		return nil
	}

	e.Record.Set("household_id", "")
	e.Record.Set("pin_hash", "")

	return nil
}

// onUserUpdated menjaga household_id tetap tidak bisa dialihkan dari klien.
//
// Update rule pada koleksi users memakai `id = @request.auth.id`, jadi secara
// bawaan user boleh mengubah field apa pun pada dirinya sendiri — termasuk
// household_id. Kalau field itu boleh ditulis, user bisa menunjuk household
// milik orang lain, langsung lolos seluruh RuleReadHousehold, dan membaca
// semua data keuangan keluarga itu. Karena itu household_id dipaksa kembali ke
// nilai milik pemanggil, dan hanya superuser yang boleh mengubahnya.
func onUserUpdateRequest(e *core.RecordRequestEvent) error {
	if e.Record == nil {
		return nil
	}

	if e.HasSuperuserAuth() {
		return nil
	}

	if e.Auth == nil {
		e.Record.Set("household_id", "")
		return nil
	}

	e.Record.Set("household_id", e.Auth.GetString("household_id"))
	return nil
}

// onUserUpdated sengaja no-op: penjagaan household_id sudah dilakukan pada
// tahap request, sebelum nilai apa pun ditulis ke database.
func onUserUpdated(e *core.RecordEvent) error {
	return nil
}

// txRefs menyimpan id wallet dan savings goal yang dirujuk sebuah transaksi.
type txRefs struct {
	householdID string
	wallets     []string
	goals       []string
}

// previousTxRefs menyimpan referensi transaksi versi SEBELUM update.
//
// Hook AfterUpdate hanya melihat nilai baru, sehingga wallet lama akan
// menyisakan saldo basi kalau transaksi dipindah ke wallet lain. Karena itu
// nilai lama dibaca di tahap OnRecordUpdate (sebelum SQL dieksekusi) dan
// disimpan sementara berdasarkan id record.
var previousTxRefs sync.Map

// capturePreviousTransactionRefs mencatat referensi lama sebuah transaksi.
func capturePreviousTransactionRefs(e *core.RecordEvent) error {
	if e.Record == nil {
		return nil
	}

	txCol, err := e.App.FindCachedCollectionByNameOrId(collections.ColTransactions)
	if err != nil {
		return fmt.Errorf("cari koleksi transactions: %w", err)
	}

	stored, err := e.App.FindRecordById(txCol.Id, e.Record.Id)
	if err != nil {
		// Record baru tidak punya baris lama; tidak ada yang perlu disimpan.
		return nil
	}

	previousTxRefs.Store(e.Record.Id, txRefs{
		householdID: stored.GetString("household_id"),
		wallets:     affectedWalletIDs(stored),
		goals:       affectedGoalIDs(stored),
	})

	return nil
}

// loadPreviousTxRefs mengambil lalu menghapus referensi lama sebuah transaksi.
func loadPreviousTxRefs(recordID string) (txRefs, bool) {
	value, ok := previousTxRefs.LoadAndDelete(recordID)
	if !ok {
		return txRefs{}, false
	}
	refs, ok := value.(txRefs)
	return refs, ok
}

// discardPreviousTxRefs membersihkan entri yang tidak pernah dipakai karena
// update gagal, supaya sync.Map tidak menumpuk.
func discardPreviousTxRefs(e *core.RecordErrorEvent) error {
	if e.Record != nil {
		previousTxRefs.Delete(e.Record.Id)
	}
	return nil
}

// recomputeAffected menghitung ulang saldo wallet dan saldo target tabungan
// yang tersentuh, semuanya dalam satu transaksi database.
func recomputeAffected(app core.App, householdID string, wallets, goals []string) error {
	if householdID == "" {
		return nil
	}

	if err := recomputeWalletBalances(app, householdID, wallets); err != nil {
		return err
	}

	for _, goalID := range goals {
		if err := recomputeSavingsAmount(app, householdID, goalID); err != nil {
			return err
		}
	}

	return nil
}

// onTransactionSaved menghitung ulang saldo wallet dan saldo savings goal yang
// terpengaruh sebuah transaksi.
func onTransactionSaved(e *core.RecordEvent) error {
	if e.Record == nil {
		return nil
	}

	householdID := e.Record.GetString("household_id")
	refs, hasRefs := loadPreviousTxRefs(e.Record.Id)

	// Transaksi pindah household: household lama harus di-recompute juga,
	// kalau tidak saldonya akan tertinggal memakai transaksi yang sudah bukan
	// miliknya lagi.
	if hasRefs && refs.householdID != "" && refs.householdID != householdID {
		if err := e.App.RunInTransaction(func(txApp core.App) error {
			return recomputeAffected(txApp, refs.householdID, refs.wallets, refs.goals)
		}); err != nil {
			return err
		}

		hasRefs = false
	}

	if householdID == "" {
		return nil
	}

	wallets := affectedWalletIDs(e.Record)
	goals := affectedGoalIDs(e.Record)

	if hasRefs {
		wallets = walletIDs(append(wallets, refs.wallets...)...)
		goals = walletIDs(append(goals, refs.goals...)...)
	}

	return e.App.RunInTransaction(func(txApp core.App) error {
		return recomputeAffected(txApp, householdID, wallets, goals)
	})
}

// onTransactionDeleted mengembalikan dampak ke wallet, sama seperti saat create/update.
func onTransactionDeleted(e *core.RecordEvent) error {
	return onTransactionSaved(e)
}

// onDebtPaymentChanged memperbarui current_balance utang setelah cicilan berubah.
func onDebtPaymentChanged(e *core.RecordEvent) error {
	if e.Record == nil {
		return nil
	}

	householdID := e.Record.GetString("household_id")
	if householdID == "" {
		return nil
	}

	debtID := e.Record.GetString("debt")
	if debtID == "" {
		return nil
	}

	walletID := e.Record.GetString("wallet")

	return e.App.RunInTransaction(func(txApp core.App) error {
		if err := recomputeDebtBalance(txApp, householdID, debtID); err != nil {
			return err
		}
		return recomputeWalletBalances(txApp, householdID, walletIDs(walletID))
	})
}

// affectedWalletIDs mengumpulkan seluruh wallet yang tersentuh sebuah transaksi:
// wallet sumber, wallet tujuan transfer, dan wallet dari cicilan utang.
func affectedWalletIDs(rec *core.Record) []string {
	return walletIDs(
		rec.GetString("wallet"),
		rec.GetString("to_wallet"),
		rec.GetString("debt_wallet"),
	)
}

// affectedGoalIDs mengumpulkan savings goal yang tersentuh transaksi.
func affectedGoalIDs(rec *core.Record) []string {
	goal := rec.GetString("savings_goal")
	if goal == "" {
		return nil
	}
	return []string{goal}
}

// walletIDs membuang id kosong dan duplikat sambil menjaga urutan.
func walletIDs(ids ...string) []string {
	seen := make(map[string]struct{}, len(ids))
	out := make([]string, 0, len(ids))

	for _, id := range ids {
		if id == "" {
			continue
		}
		if _, dup := seen[id]; dup {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}

	return out
}
