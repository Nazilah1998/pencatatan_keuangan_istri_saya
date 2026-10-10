package handlers

import (
	"sync"
	"time"

	"github.com/gofiber/fiber/v3"

	"sintya-finance/backend/internal/apierr"
	"sintya-finance/backend/internal/middleware"
	"sintya-finance/backend/internal/services"
)

// Reports menangani seluruh endpoint agregasi yang butuh perhitungan di server.
// Data mentah tetap dibaca langsung dari PocketBase oleh frontend; endpoint ini
// hanya untuk agregasi yang mahal atau lintas tabel.
type Reports struct {
	store services.Store
}

// NewReports membuat handler laporan.
func NewReports(store services.Store) *Reports { return &Reports{store: store} }

// Register mendaftarkan route laporan pada group yang sudah dilindungi AuthGuard.
func (h *Reports) Register(router fiber.Router) {
	router.Get("/reports/summary", h.Summary)
	router.Get("/reports/cashflow", h.Cashflow)
	router.Get("/reports/budget", h.Budget)
	router.Get("/reports/categories", h.Categories)
}

// SummaryPayload menggabungkan angka-angka utama untuk halaman dashboard.
type SummaryPayload struct {
	NetWorth     *services.NetWorth     `json:"net_worth"`
	NetWorthNum  float64                `json:"netWorth"`
	TotalBalance float64                `json:"totalBalance"`
	TotalBalSnake float64               `json:"total_balance"`
	Income       float64                `json:"income"`
	Expense      float64                `json:"expense"`
	Transfer     float64                `json:"transfer"`
	Net          float64                `json:"net"`
	SavingsTotal float64                `json:"savingsTotal"`
	SavingsSnake float64                `json:"savings_total"`
	DebtTotal    float64                `json:"debtTotal"`
	DebtSnake    float64                `json:"debt_total"`
	TxCount      int                    `json:"tx_count"`
	BudgetUsed   float64                `json:"budget_used"`
	BudgetLimit  float64                `json:"budget_limit"`
	Month        string                 `json:"month"`
	Breakdown    *services.CategoryItem `json:"-"`
}

// Summary mengembalikan ringkasan untuk satu bulan.
func (h *Reports) Summary(c fiber.Ctx) error {
	householdID := middleware.HouseholdID(c)
	if householdID == "" {
		return apierr.Fail(c, apierr.Unauthorized("Household tidak dikenali"))
	}

	month := c.Query("month", time.Now().Format("2006-01"))
	start, end, err := services.MonthRange(month)
	if err != nil {
		return apierr.Fail(c, apierr.BadRequest(err.Error()))
	}

	ctx := c.RequestCtx()

	var (
		flow      *services.Cashflow
		flowErr   error
		worth     *services.NetWorth
		worthErr  error
		budget    *services.BudgetOverview
		budgetErr error
		wg        sync.WaitGroup
	)

	wg.Add(3)
	go func() {
		defer wg.Done()
		flow, flowErr = services.GetCashflow(ctx, h.store, householdID, start, end)
	}()
	go func() {
		defer wg.Done()
		worth, worthErr = services.GetNetWorth(ctx, h.store, householdID)
	}()
	go func() {
		defer wg.Done()
		budget, budgetErr = services.GetBudget(ctx, h.store, householdID, month)
	}()
	wg.Wait()

	if flowErr != nil {
		return apierr.Fail(c, apierr.Internal("Gagal menghitung arus kas"))
	}
	if worthErr != nil {
		return apierr.Fail(c, apierr.Internal("Gagal menghitung aset bersih"))
	}
	if budgetErr != nil {
		return apierr.Fail(c, apierr.Internal("Gagal menghitung anggaran"))
	}

	return apierr.OK(c, SummaryPayload{
		NetWorth:      worth,
		NetWorthNum:   worth.Net,
		TotalBalance:  worth.Assets,
		TotalBalSnake: worth.Assets,
		Income:        flow.Income,
		Expense:       flow.Expense,
		Transfer:      flow.Transfer,
		Net:           flow.Net,
		SavingsTotal:  worth.SavingsTotal,
		SavingsSnake:  worth.SavingsTotal,
		DebtTotal:     worth.Liabilities,
		DebtSnake:     worth.Liabilities,
		TxCount:       flow.TxCount,
		BudgetUsed:    budget.TotalSpent,
		BudgetLimit:   budget.TotalLimit,
		Month:         month,
	})
}

// Cashflow mengembalikan arus kas harian dalam rentang tanggal.
func (h *Reports) Cashflow(c fiber.Ctx) error {
	householdID := middleware.HouseholdID(c)
	if householdID == "" {
		return apierr.Fail(c, apierr.Unauthorized("Household tidak dikenali"))
	}

	start := c.Query("start", time.Now().AddDate(0, 0, -29).Format("2006-01-02"))
	end := c.Query("end", time.Now().Format("2006-01-02"))

	if len(start) == 7 && len(end) == 7 {
		sDate, _, errS := services.MonthRange(start)
		_, eDate, errE := services.MonthRange(end)
		if errS == nil && errE == nil {
			start = sDate
			end = eDate
		}
	}

	if end < start {
		return apierr.Fail(c, apierr.BadRequest("Rentang tanggal terbalik"))
	}

	ctx := c.RequestCtx()

	flow, err := services.GetCashflow(ctx, h.store, householdID, start, end)
	if err != nil {
		return apierr.Fail(c, apierr.Internal("Gagal menghitung arus kas"))
	}

	return apierr.OK(c, flow)
}

// Budget mengembalikan status pagu per kategori untuk satu bulan.
func (h *Reports) Budget(c fiber.Ctx) error {
	householdID := middleware.HouseholdID(c)
	if householdID == "" {
		return apierr.Fail(c, apierr.Unauthorized("Household tidak dikenali"))
	}

	month := c.Query("month", time.Now().Format("2006-01"))

	ctx := c.RequestCtx()

	overview, err := services.GetBudget(ctx, h.store, householdID, month)
	if err != nil {
		return apierr.Fail(c, apierr.BadRequest(err.Error()))
	}

	return apierr.OK(c, overview)
}

// Categories mengembalikan komposisi kategori untuk laporan.
func (h *Reports) Categories(c fiber.Ctx) error {
	householdID := middleware.HouseholdID(c)
	if householdID == "" {
		return apierr.Fail(c, apierr.Unauthorized("Household tidak dikenali"))
	}

	month := c.Query("month", time.Now().Format("2006-01"))
	kind := c.Query("type", "expense")

	start, end, err := services.MonthRange(month)
	if err != nil {
		return apierr.Fail(c, apierr.BadRequest(err.Error()))
	}

	ctx := c.RequestCtx()

	breakdown, err := services.GetCategoryBreakdown(ctx, h.store, householdID, start, end, kind)
	if err != nil {
		return apierr.Fail(c, apierr.Internal("Gagal menghitung komposisi kategori"))
	}

	return apierr.OK(c, breakdown)
}
