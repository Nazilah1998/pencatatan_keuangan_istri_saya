package hooks

import (
	"fmt"
	"log/slog"

	"github.com/pocketbase/pocketbase/core"

	"sintya-finance/backend/internal/collections"
	"sintya-finance/backend/internal/services"
)

// DeltaWallet adalah perubahan saldo sebuah wallet akibat satu transaksi.
// Convention tanda: positif menambah saldo, negatif mengurangi.
func DeltaWallet(rec *core.Record) float64 {
	amount := rec.GetFloat("amount")
	kind := rec.GetString("type")

	switch kind {
	case "income":
		return amount
	case "expense":
		// Setoran tabungan juga mengurangi saldo dompet sumber; bedanya hanya
		// pada klasifikasi laporan (lihat services.IsSavingsContribution).
		return -amount
	case "transfer":
		// Transfer: wallet sumber -, wallet tujuan + (dihitung terpisah).
		return -amount
	default:
		return 0
	}
}

// recomputeWalletBalances menghitung saldo wallet dari nol: initial_balance
// ditambah seluruh transaksi yang terkait. Menghitung ulang (bukan
// menambahkan delta) membuat hasil idempoten dan bebas dari drift.
func recomputeWalletBalances(app core.App, householdID string, walletIDs []string) error {
	if householdID == "" || len(walletIDs) == 0 {
		return nil
	}

	walletCol, err := app.FindCachedCollectionByNameOrId(collections.ColWallets)
	if err != nil {
		return fmt.Errorf("cari koleksi wallets: %w", err)
	}

	txCol, err := app.FindCachedCollectionByNameOrId(collections.ColTransactions)
	if err != nil {
		return fmt.Errorf("cari koleksi transactions: %w", err)
	}

	for _, walletID := range walletIDs {
		if walletID == "" {
			continue
		}

		wallet, err := app.FindRecordById(walletCol.Id, walletID)
		if err != nil {
			slog.Warn("wallet tidak ditemukan saat recompute", "wallet", walletID)
			continue
		}
		if wallet.GetString("household_id") != householdID {
			continue
		}

		balance := wallet.GetFloat("initial_balance")

		// Sumber: transaksi income/expense dari wallet ini.
		records, err := app.FindRecordsByFilter(
			txCol.Id,
			`household_id = {:h} && wallet = {:w}`,
			"date", 0, 0,
			map[string]any{"h": householdID, "w": walletID},
		)
		if err != nil {
			return fmt.Errorf("ambil transaksi wallet %s: %w", walletID, err)
		}

		for _, rec := range records {
			amount := rec.GetFloat("amount")
			switch rec.GetString("type") {
			case "income":
				balance += amount
			case "expense":
				balance -= amount
			case "transfer":
				// outgoing dihitung lewat query kedua di bawah
				balance -= amount
			}
		}

		// Tujuan: transaksi transfer masuk ke wallet ini.
		incoming, err := app.FindRecordsByFilter(
			txCol.Id,
			`household_id = {:h} && to_wallet = {:w} && type = "transfer"`,
			"date", 0, 0,
			map[string]any{"h": householdID, "w": walletID},
		)
		if err != nil {
			return fmt.Errorf(" ambil transfer masuk wallet %s: %w", walletID, err)
		}
		for _, rec := range incoming {
			balance += rec.GetFloat("amount")
		}

		// Cicilan utang yang dibayar dari wallet ini mengurangi saldo.
		balance -= paidFromWallet(app, householdID, walletID)

		if wallet.GetFloat("balance") == balance {
			continue
		}

		wallet.Set("balance", balance)
		if err := app.Save(wallet); err != nil {
			return fmt.Errorf("simpan saldo wallet %s: %w", walletID, err)
		}
	}

	return nil
}

// paidFromWallet menjumlahkan cicilan utang yang dibayar dari sebuah wallet.
func paidFromWallet(app core.App, householdID, walletID string) float64 {
	if walletID == "" {
		return 0
	}

	payCol, err := app.FindCachedCollectionByNameOrId(collections.ColDebtPayments)
	if err != nil {
		return 0
	}

	records, err := app.FindRecordsByFilter(
		payCol.Id,
		`household_id = {:h} && wallet = {:w}`,
		"date", 0, 0,
		map[string]any{"h": householdID, "w": walletID},
	)
	if err != nil {
		slog.Warn("gagal menjumlahkan cicilan per wallet", "wallet", walletID, "error", err)
		return 0
	}

	total := 0.0
	for _, rec := range records {
		total += rec.GetFloat("amount")
	}
	return total
}

// recomputeSavingsAmount menghitung ulang current_amount sebuah target tabungan
// dari seluruh transaksi yang terkait dengannya.
func recomputeSavingsAmount(app core.App, householdID, savingsID string) error {
	if savingsID == "" {
		return nil
	}

	savCol, err := app.FindCachedCollectionByNameOrId(collections.ColSavings)
	if err != nil {
		return fmt.Errorf("cari koleksi savings: %w", err)
	}
	txCol, err := app.FindCachedCollectionByNameOrId(collections.ColTransactions)
	if err != nil {
		return fmt.Errorf("cari koleksi transactions: %w", err)
	}

	goal, err := app.FindRecordById(savCol.Id, savingsID)
	if err != nil {
		slog.Warn("target tabungan tidak ditemukan", "savings", savingsID)
		return nil
	}
	if goal.GetString("household_id") != householdID {
		return nil
	}

	records, err := app.FindRecordsByFilter(
		txCol.Id,
		`household_id = {:h} && savings_goal = {:s}`,
		"date", 0, 0,
		map[string]any{"h": householdID, "s": savingsID},
	)
	if err != nil {
		return fmt.Errorf("ambil transaksi tabungan %s: %w", savingsID, err)
	}

	current := 0.0
	for _, rec := range records {
		// Hanya setoran (expense + savings_goal) yang menambah dana target.
		if services.IsSavingsContribution(rec) {
			current += rec.GetFloat("amount")
		}
	}

	if current < 0 {
		current = 0
	}

	if goal.GetFloat("current_amount") == current {
		return nil
	}

	goal.Set("current_amount", current)

	if target := goal.GetFloat("target_amount"); target > 0 && current >= target {
		goal.Set("status", "completed")
	} else if goal.GetString("status") == "completed" && current < target {
		goal.Set("status", "active")
	}

	if err := app.Save(goal); err != nil {
		return fmt.Errorf("simpan target tabungan %s: %w", savingsID, err)
	}

	return nil
}

// recomputeDebtBalance menghitung current_balance utang dari principal dikurangi
// seluruh cicilan yang tercatat, lalu memperbarui statusnya.
func recomputeDebtBalance(app core.App, householdID, debtID string) error {
	if debtID == "" {
		return nil
	}

	debtCol, err := app.FindCachedCollectionByNameOrId(collections.ColDebts)
	if err != nil {
		return fmt.Errorf("cari koleksi debts: %w", err)
	}
	payCol, err := app.FindCachedCollectionByNameOrId(collections.ColDebtPayments)
	if err != nil {
		return fmt.Errorf("cari koleksi debt_payments: %w", err)
	}

	debt, err := app.FindRecordById(debtCol.Id, debtID)
	if err != nil {
		slog.Warn("utang tidak ditemukan", "debt", debtID)
		return nil
	}
	if debt.GetString("household_id") != householdID {
		return nil
	}

	records, err := app.FindRecordsByFilter(
		payCol.Id,
		`household_id = {:h} && debt = {:d}`,
		"date", 0, 0,
		map[string]any{"h": householdID, "d": debtID},
	)
	if err != nil {
		return fmt.Errorf("ambil cicilan utang %s: %w", debtID, err)
	}

	paid := 0.0
	for _, rec := range records {
		paid += rec.GetFloat("amount")
	}

	balance := debt.GetFloat("principal") - paid
	if balance < 0 {
		balance = 0
	}

	debt.Set("current_balance", balance)

	switch {
	case balance <= 0:
		debt.Set("status", "paid")
	default:
		debt.Set("status", "active")
	}

	if debt.GetFloat("current_balance") == balance && debt.GetString("status") != "active" {
		// status mungkin sudah benar; tetap simpan bila berubah
	}
	if err := app.Save(debt); err != nil {
		return fmt.Errorf("simpan utang %s: %w", debtID, err)
	}

	return nil
}

// RecomputeAll menghitung ulang seluruh nilai turunan untuk satu household.
// Dipakai oleh command seed/repair dan oleh scheduled job.
func RecomputeAll(_ any, app core.App) error {
	wallets, err := allIDs(app, collections.ColWallets)
	if err != nil {
		return err
	}

	for _, w := range wallets {
		rec, err := findByID(app, collections.ColWallets, w)
		if err != nil || rec == nil {
			continue
		}
		householdID := rec.GetString("household_id")
		if err := recomputeWalletBalances(app, householdID, []string{w}); err != nil {
			return err
		}
	}

	savings, err := allIDs(app, collections.ColSavings)
	if err != nil {
		return err
	}
	for _, s := range savings {
		rec, err := findByID(app, collections.ColSavings, s)
		if err != nil || rec == nil {
			continue
		}
		if err := recomputeSavingsAmount(app, rec.GetString("household_id"), s); err != nil {
			return err
		}
	}

	debts, err := allIDs(app, collections.ColDebts)
	if err != nil {
		return err
	}
	for _, d := range debts {
		rec, err := findByID(app, collections.ColDebts, d)
		if err != nil || rec == nil {
			continue
		}
		if err := recomputeDebtBalance(app, rec.GetString("household_id"), d); err != nil {
			return err
		}
	}

	slog.Info("recompute seluruh nilai turunan selesai")
	return nil
}
