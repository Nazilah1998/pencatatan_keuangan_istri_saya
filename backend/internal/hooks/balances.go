package hooks

import (
	"fmt"
	"log/slog"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"

	"sintya-finance/backend/internal/collections"
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
		return -amount
	case "transfer":
		return -amount
	default:
		return 0
	}
}

func recomputeWalletBalances(app core.App, householdID string, walletIDs []string) error {
	if householdID == "" || len(walletIDs) == 0 {
		return nil
	}

	walletCol, err := app.FindCachedCollectionByNameOrId(collections.ColWallets)
	if err != nil {
		return fmt.Errorf("cari koleksi wallets: %w", err)
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

		var netOutgoing float64
		_ = app.DB().NewQuery(`
			SELECT COALESCE(SUM(
				CASE 
					WHEN type = 'income' THEN amount 
					WHEN type = 'expense' THEN -amount 
					WHEN type = 'transfer' THEN -amount 
					ELSE 0 
				END
			), 0)
			FROM ` + collections.ColTransactions + `
			WHERE household_id = {:h} AND wallet = {:w}
		`).Bind(dbx.Params{"h": householdID, "w": walletID}).Row(&netOutgoing)

		var netIncoming float64
		_ = app.DB().NewQuery(`
			SELECT COALESCE(SUM(amount), 0)
			FROM ` + collections.ColTransactions + `
			WHERE household_id = {:h} AND to_wallet = {:w} AND type = 'transfer'
		`).Bind(dbx.Params{"h": householdID, "w": walletID}).Row(&netIncoming)

		debtPaid := paidFromWallet(app, householdID, walletID)

		balance := wallet.GetFloat("initial_balance") + netOutgoing + netIncoming - debtPaid

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

func paidFromWallet(app core.App, householdID, walletID string) float64 {
	if walletID == "" {
		return 0
	}

	var total float64
	_ = app.DB().NewQuery(`
		SELECT COALESCE(SUM(amount), 0)
		FROM ` + collections.ColDebtPayments + `
		WHERE household_id = {:h} AND wallet = {:w}
	`).Bind(dbx.Params{"h": householdID, "w": walletID}).Row(&total)

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

	goal, err := app.FindRecordById(savCol.Id, savingsID)
	if err != nil {
		slog.Warn("target tabungan tidak ditemukan", "savings", savingsID)
		return nil
	}
	if goal.GetString("household_id") != householdID {
		return nil
	}

	var current float64
	_ = app.DB().NewQuery(`
		SELECT COALESCE(SUM(amount), 0)
		FROM ` + collections.ColTransactions + `
		WHERE household_id = {:h} AND savings_goal = {:s} AND type = 'expense'
	`).Bind(dbx.Params{"h": householdID, "s": savingsID}).Row(&current)

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

func recomputeDebtBalance(app core.App, householdID, debtID string) error {
	if debtID == "" {
		return nil
	}

	debtCol, err := app.FindCachedCollectionByNameOrId(collections.ColDebts)
	if err != nil {
		return fmt.Errorf("cari koleksi debts: %w", err)
	}

	debt, err := app.FindRecordById(debtCol.Id, debtID)
	if err != nil {
		slog.Warn("utang tidak ditemukan", "debt", debtID)
		return nil
	}
	if debt.GetString("household_id") != householdID {
		return nil
	}

	var paid float64
	_ = app.DB().NewQuery(`
		SELECT COALESCE(SUM(amount), 0)
		FROM ` + collections.ColDebtPayments + `
		WHERE household_id = {:h} AND debt = {:d}
	`).Bind(dbx.Params{"h": householdID, "d": debtID}).Row(&paid)

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
