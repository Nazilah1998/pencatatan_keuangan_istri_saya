package hooks

import (
	"context"
	"fmt"
	"log/slog"
	"sort"
	"time"

	"github.com/pocketbase/pocketbase/core"

	"sintya-finance/backend/internal/collections"
)

// Register memasang seluruh hook yang menjaga integritas data:
//
//   - household_id diisi otomatis saat signup (dari ID user pemilik)
//   - saldo wallet, current_amount savings, dan current_balance debts
//     dihitung ulang di dalam RunInTransaction setiap mutasi terkait
//
// Semua hook sengaja memakai AfterCreate/AfterUpdate/AfterDeleteSuccess supaya
// perhitungan turunan tidak masuk dalam request klien.
func Register(app core.App) {
	app.OnRecordCreateRequest(collections.ColUsers).BindFunc(onUserCreateRequest)
	app.OnRecordUpdateRequest(collections.ColUsers).BindFunc(onUserUpdateRequest)
	app.OnRecordAfterCreateSuccess(collections.ColUsers).BindFunc(onUserCreated)
	app.OnRecordAfterUpdateSuccess(collections.ColUsers).BindFunc(onUserUpdated)

	app.OnRecordUpdate(collections.ColTransactions).BindFunc(capturePreviousTransactionRefs)
	app.OnRecordAfterCreateSuccess(collections.ColTransactions).BindFunc(onTransactionSaved)
	app.OnRecordAfterUpdateSuccess(collections.ColTransactions).BindFunc(onTransactionSaved)
	app.OnRecordAfterUpdateError(collections.ColTransactions).BindFunc(discardPreviousTxRefs)
	app.OnRecordAfterDeleteSuccess(collections.ColTransactions).BindFunc(onTransactionDeleted)

	app.OnRecordAfterCreateSuccess(collections.ColDebtPayments).BindFunc(onDebtPaymentChanged)
	app.OnRecordAfterUpdateSuccess(collections.ColDebtPayments).BindFunc(onDebtPaymentChanged)
	app.OnRecordAfterDeleteSuccess(collections.ColDebtPayments).BindFunc(onDebtPaymentChanged)

	app.OnRecordAfterCreateSuccess(collections.ColWallets).BindFunc(onWalletSaved)
	app.OnRecordAfterUpdateSuccess(collections.ColWallets).BindFunc(onWalletSaved)

	app.OnRecordAfterCreateSuccess(collections.ColDebts).BindFunc(onDebtSaved)
	app.OnRecordAfterUpdateSuccess(collections.ColDebts).BindFunc(onDebtSaved)
}

// StartBackgroundJobs menjalankan tugas periodik: recompute saldo, WAL checkpoint,
// PRAGMA optimize, dan backup otomatis harian.
func StartBackgroundJobs(app core.App) {
	runMaintenance(app)

	maintTicker := time.NewTicker(6 * time.Hour)
	backupTicker := time.NewTicker(24 * time.Hour)
	defer maintTicker.Stop()
	defer backupTicker.Stop()

	for {
		select {
		case <-maintTicker.C:
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			if err := RecomputeAll(ctx, app); err != nil {
				slog.Error("recompute terjadwal gagal", "error", err)
			}
			runMaintenance(app)
			cancel()
		case <-backupTicker.C:
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
			runAutoBackup(ctx, app, 7)
			cancel()
		}
	}
}

func runMaintenance(app core.App) {
	if db := app.DB(); db != nil {
		_, _ = db.NewQuery("PRAGMA wal_checkpoint(PASSIVE);").Execute()
		_, _ = db.NewQuery("PRAGMA optimize;").Execute()
	}
}

func runAutoBackup(ctx context.Context, app core.App, maxKeep int) {
	name := fmt.Sprintf("auto_%s.zip", time.Now().Format("20060102_150405"))
	if err := app.CreateBackup(ctx, name); err != nil {
		slog.Warn("auto backup gagal", "error", err)
		return
	}
	slog.Info("auto backup berhasil", "nama", name)

	fs, err := app.NewBackupsFilesystem()
	if err != nil {
		return
	}
	defer fs.Close()

	objects, err := fs.List("")
	if err != nil || len(objects) <= maxKeep {
		return
	}

	sort.Slice(objects, func(i, j int) bool {
		return objects[i].ModTime.Before(objects[j].ModTime)
	})

	for i := 0; i < len(objects)-maxKeep; i++ {
		_ = fs.Delete(objects[i].Key)
	}
}
