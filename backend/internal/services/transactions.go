package services

import "github.com/pocketbase/pocketbase/core"

// IsSavingsContribution menandai setoran ke target tabungan, yaitu transaksi
// expense yang tertaut ke savings_goal.
//
// Nominalnya keluar dari dompet sumber, tetapi bukan pengeluaran: uang dipindah
// dari dompet ke dalam target milik household yang sama. Karena itu setoran
// diperlakukan seperti transfer pada agregasi arus kas dan laporan kategori,
// supaya pengeluaran riil tidak ikut terbuang.
func IsSavingsContribution(rec *core.Record) bool {
	return rec.GetString("type") == "expense" && rec.GetString("savings_goal") != ""
}
