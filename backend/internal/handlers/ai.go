package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"

	"sintya-finance/backend/internal/apierr"
	"sintya-finance/backend/internal/middleware"
	"sintya-finance/backend/internal/services"
)

// AI menghasilkan ringkasan keuangan memakai Gemini.
//
// Data diringkas lebih dulu di server supaya hanya statistik yang dikirim ke
// Gemini, bukan transaksi mentah. Ini menjaga privasi sekaligus menekan token.
type AI struct {
	apiKey string
	store  services.Store
	client *http.Client
	model  string
}

// NewAI membuat handler AI.
func NewAI(apiKey string, store services.Store) *AI {
	return &AI{
		apiKey: apiKey,
		store:  store,
		client: &http.Client{Timeout: 25 * time.Second},
		model:  "gemini-2.0-flash",
	}
}

// Register mendaftarkan route AI pada group yang dilindungi AuthGuard.
func (h *AI) Register(router fiber.Router) {
	router.Post("/ai/insights", h.Insights)
}

type insightRequest struct {
	Month string `json:"month"`
}

// Insights mengembalikan beberapa catatan keuangan berbasis data bulan berjalan.
func (h *AI) Insights(c fiber.Ctx) error {
	if h.apiKey == "" {
		return apierr.Fail(c, apierr.BadRequest("GEMINI_API_KEY belum dikonfigurasi"))
	}

	householdID := middleware.HouseholdID(c)
	if householdID == "" {
		return apierr.Fail(c, apierr.Unauthorized("Household tidak dikenali"))
	}

	var body insightRequest
	_ = c.Bind().JSON(&body)
	if body.Month == "" {
		body.Month = time.Now().Format("2006-01")
	}

	start, end, err := services.MonthRange(body.Month)
	if err != nil {
		return apierr.Fail(c, apierr.BadRequest(err.Error()))
	}

	ctx := c.RequestCtx()

	flow, err := services.GetCashflow(ctx, h.store, householdID, start, end)
	if err != nil {
		return apierr.Fail(c, apierr.Internal("Gagal menyiapkan data ringkasan"))
	}

	breakdown, err := services.GetCategoryBreakdown(ctx, h.store, householdID, start, end, "expense")
	if err != nil {
		return apierr.Fail(c, apierr.Internal("Gagal menyiapkan komposisi pengeluaran"))
	}

	budget, err := services.GetBudget(ctx, h.store, householdID, body.Month)
	if err != nil {
		return apierr.Fail(c, apierr.Internal("Gagal menyiapkan data anggaran"))
	}

	prompt := buildPrompt(body.Month, flow, breakdown, budget)

	text, err := h.callGemini(ctx, prompt)
	if err != nil {
		return apierr.Fail(c, apierr.Upstream("Layanan AI sedang tidak tersedia"))
	}

	return apierr.OK(c, fiber.Map{
		"month":   body.Month,
		"insight": strings.TrimSpace(text),
	})
}

// buildPrompt menyusun ringkasan statistik dalam bahasa Indonesia.
func buildPrompt(month string, flow *services.Cashflow, breakdown *services.CategoryBreakdown, budget *services.BudgetOverview) string {
	var sb strings.Builder

	fmt.Fprintf(&sb, "Berikut ringkasan keuangan pribadi untuk bulan %s.\n\n", month)
	fmt.Fprintf(&sb, "Pemasukan: Rp%.0f\n", flow.Income)
	fmt.Fprintf(&sb, "Pengeluaran: Rp%.0f\n", flow.Expense)
	fmt.Fprintf(&sb, "Surat/rugi: Rp%.0f\n", flow.Net)
	fmt.Fprintf(&sb, "Jumlah transaksi: %d\n\n", flow.TxCount)

	if len(breakdown.Items) > 0 {
		sb.WriteString("Komposisi pengeluaran:\n")
		for i, item := range breakdown.Items {
			if i >= 5 {
				break
			}
			fmt.Fprintf(&sb, "- %s: Rp%.0f (%.1f%%)\n", item.Name, item.Total, item.Percent)
		}
		sb.WriteString("\n")
	}

	if len(budget.Items) > 0 {
		sb.WriteString("Status anggaran:\n")
		for i, item := range budget.Items {
			if i >= 5 {
				break
			}
			status := "aman"
			if item.Over {
				status = "LEBIH"
			}
			fmt.Fprintf(&sb, "- %s: terpakai Rp%.0f dari Rp%.0f (%s)\n",
				item.Category, item.Spent, item.Limit, status)
		}
		sb.WriteString("\n")
	}

	sb.WriteString("Tulis 3-5 catatan singkat dan praktis dalam Bahasa Indonesia. " +
		"Gunakan angka yang ada, hindari nasihat umum, dan jangan mengarang data.")

	return sb.String()
}

type geminiRequest struct {
	Contents []geminiContent `json:"contents"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

// callGemini memanggil endpoint generativetext Google.
func (h *AI) callGemini(ctx context.Context, prompt string) (string, error) {
	body, err := json.Marshal(geminiRequest{
		Contents: []geminiContent{{Parts: []geminiPart{{Text: prompt}}}},
	})
	if err != nil {
		return "", fmt.Errorf("marshal prompt: %w", err)
	}

	url := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
		h.model, h.apiKey,
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("buat request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := h.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("kirim request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		detail, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return "", fmt.Errorf("gemini status %d: %s", resp.StatusCode, detail)
	}

	var parsed geminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return "", fmt.Errorf("decode respons: %w", err)
	}

	if len(parsed.Candidates) == 0 || len(parsed.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("respons gemini kosong")
	}

	return parsed.Candidates[0].Content.Parts[0].Text, nil
}
