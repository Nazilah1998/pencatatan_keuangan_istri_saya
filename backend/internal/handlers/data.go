package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v3"

	"sintya-finance/backend/internal/apierr"
	"sintya-finance/backend/internal/middleware"
	"sintya-finance/backend/internal/services"
)

// Data menangani ekspor & pemulihan data.
type Data struct {
	store   services.Store
	restore services.RestoreWriter
}

// NewData membuat handler data.
func NewData(store services.Store, restore services.RestoreWriter) *Data {
	return &Data{store: store, restore: restore}
}

// Register mendaftarkan route data pada group yang dilindungi AuthGuard.
func (h *Data) Register(router fiber.Router) {
	router.Get("/export", h.Export)
	router.Get("/export/transactions.csv", h.ExportCSV)
	router.Post("/restore", h.Restore)
}

// Export mengembalikan seluruh data household sebagai unduhan JSON.
func (h *Data) Export(c fiber.Ctx) error {
	householdID := middleware.HouseholdID(c)
	if householdID == "" {
		return apierr.Fail(c, apierr.Unauthorized("Household tidak dikenali"))
	}

	payload, err := services.ExportJSON(c.RequestCtx(), h.store, householdID)
	if err != nil {
		return apierr.Fail(c, apierr.Internal("Gagal menyusun data ekspor"))
	}

	var buf bytes.Buffer
	if err := services.ToJSON(&buf, payload); err != nil {
		return apierr.Fail(c, apierr.Internal("Gagal menulis data ekspor"))
	}

	filename := fmt.Sprintf("sintya-finance-%s.json", time.Now().Format("2006-01-02"))
	c.Set(fiber.HeaderContentDisposition, `attachment; filename="`+filename+`"`)
	c.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)

	return c.Send(buf.Bytes())
}

// ExportCSV mengembalikan transaksi periode tertentu sebagai CSV.
func (h *Data) ExportCSV(c fiber.Ctx) error {
	householdID := middleware.HouseholdID(c)
	if householdID == "" {
		return apierr.Fail(c, apierr.Unauthorized("Household tidak dikenali"))
	}

	month := c.Query("month", time.Now().Format("2006-01"))
	start, end, err := services.MonthRange(month)
	if err != nil {
		return apierr.Fail(c, apierr.BadRequest(err.Error()))
	}

	csv, err := services.TransactionsToCSV(c.RequestCtx(), h.store, householdID, start, end)
	if err != nil {
		return apierr.Fail(c, apierr.Internal("Gagal menyusun CSV transaksi"))
	}

	c.Set(fiber.HeaderContentDisposition,
		fmt.Sprintf(`attachment; filename="transaksi-%s.csv"`, month))
	c.Set(fiber.HeaderContentType, "text/csv; charset=utf-8")
	c.Set("X-Content-Type-Options", "nosniff")

	return c.Send(csv)
}

// RestorePayloadBody adalah bentuk request yang diterima endpoint restore.
type RestorePayloadBody struct {
	Replace bool                    `json:"replace"`
	Data    services.RestorePayload `json:"data"`
}

// Restore memasukkan data dari file ekspor ke household pengguna.
func (h *Data) Restore(c fiber.Ctx) error {
	householdID := middleware.HouseholdID(c)
	if householdID == "" {
		return apierr.Fail(c, apierr.Unauthorized("Household tidak dikenali"))
	}

	var body RestorePayloadBody
	if err := json.Unmarshal(c.Body(), &body); err == nil && body.Data.Version == 1 {
		// Parsed as wrapped body
	} else {
		var direct services.RestorePayload
		if errDirect := json.Unmarshal(c.Body(), &direct); errDirect == nil && direct.Version == 1 {
			body.Data = direct
		} else {
			return apierr.Fail(c, apierr.BadRequest("Format berkas cadangan tidak valid (harus file JSON ekspor sintya-finance)"))
		}
	}

	if body.Data.HouseholdID == "" {
		body.Data.HouseholdID = householdID
	}

	result, err := services.Restore(c.RequestCtx(), h.restore, householdID, &body.Data, body.Replace)
	if err != nil {
		return apierr.Fail(c, apierr.BadRequest("Restore gagal: "+err.Error()))
	}

	return apierr.OK(c, result)
}
