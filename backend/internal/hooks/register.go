package hooks

import (
	"context"
	"log/slog"
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

// StartBackgroundJobs menjalankan tugas periodik. Dipanggil sebagai goroutine
// dari pocketbase.New.
func StartBackgroundJobs(app core.App) {
	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		if err := RecomputeAll(ctx, app); err != nil {
			slog.Error("recompute terjadwal gagal", "error", err)
		}
		cancel()
	}
}
