package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"

	"sintya-finance/backend/internal/apierr"
	"sintya-finance/backend/internal/config"
)

type Turnstile struct {
	secret    string
	hostnames map[string]struct{}
	client    *http.Client
}

func NewTurnstile(cfg *config.Config) *Turnstile {
	hMap := make(map[string]struct{})
	for _, h := range cfg.TurnstileHostnames {
		if trimmed := strings.TrimSpace(h); trimmed != "" {
			hMap[trimmed] = struct{}{}
		}
	}
	return &Turnstile{
		secret:    cfg.TurnstileSecret,
		hostnames: hMap,
		client:    &http.Client{Timeout: 10 * time.Second},
	}
}

type turnstileVerifyRequest struct {
	Token  string `json:"token"`
	Action string `json:"action"`
}

type turnstileResponse struct {
	Success    bool     `json:"success"`
	Action     string   `json:"action"`
	Hostname   string   `json:"hostname"`
	ErrorCodes []string `json:"error-codes"`
}

func (t *Turnstile) Verify(c fiber.Ctx) error {
	var req turnstileVerifyRequest
	if err := c.Bind().Body(&req); err != nil {
		return apierr.Fail(c, apierr.BadRequest("Format data tidak valid"))
	}

	token := strings.TrimSpace(req.Token)
	if token == "" || len(token) > 2048 {
		return apierr.Fail(c, apierr.BadRequest("Token Turnstile tidak valid"))
	}

	if t.secret == "" {
		return apierr.OK(c, fiber.Map{"verified": true})
	}

	remoteIP := c.Get("CF-Connecting-IP")
	if remoteIP == "" {
		if xff := c.Get("X-Forwarded-For"); xff != "" {
			parts := strings.Split(xff, ",")
			remoteIP = strings.TrimSpace(parts[0])
		} else {
			remoteIP = c.IP()
		}
	}

	formData := url.Values{}
	formData.Set("secret", t.secret)
	formData.Set("response", token)
	if remoteIP != "" && !strings.HasPrefix(remoteIP, "127.") && remoteIP != "::1" {
		formData.Set("remoteip", remoteIP)
	}

	httpReq, err := http.NewRequestWithContext(
		c.Context(),
		http.MethodPost,
		"https://challenges.cloudflare.com/turnstile/v0/siteverify",
		strings.NewReader(formData.Encode()),
	)
	if err != nil {
		return apierr.Fail(c, apierr.Internal("Gagal menghubungi layanan verifikasi"))
	}
	httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := t.client.Do(httpReq)
	if err != nil {
		return apierr.Fail(c, apierr.Internal("Gagal menghubungi server Turnstile"))
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return apierr.Fail(c, apierr.Internal("Gagal membaca respons Turnstile"))
	}

	var res turnstileResponse
	if err := json.Unmarshal(bodyBytes, &res); err != nil {
		return apierr.Fail(c, apierr.Internal("Respons Turnstile tidak valid"))
	}

	if !res.Success {
		return apierr.Fail(c, apierr.Forbidden("Verifikasi bot Turnstile tidak berhasil"))
	}

	if req.Action != "" && res.Action != "" && res.Action != req.Action {
		return apierr.Fail(c, apierr.Forbidden("Aksi Turnstile tidak sesuai"))
	}

	if len(t.hostnames) > 0 && res.Hostname != "" {
		if _, ok := t.hostnames[res.Hostname]; !ok {
			return apierr.Fail(c, apierr.Forbidden("Hostname Turnstile tidak diizinkan"))
		}
	}

	return apierr.OK(c, fiber.Map{"verified": true})
}
