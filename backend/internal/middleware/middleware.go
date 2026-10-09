package middleware

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/pocketbase/pocketbase/core"

	"sintya-finance/backend/internal/apierr"
	"sintya-finance/backend/internal/collections"
)

type App interface {
	FindCollectionByNameOrId(nameOrId string) (*core.Collection, error)
	FindAuthRecordByToken(token string, validTypes ...string) (*core.Record, error)
}

type RemoteUser struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	Name        string `json:"name"`
	HouseholdID string `json:"household_id"`
}

var (
	tokenCache   sync.Map
	remoteClient = &http.Client{Timeout: 5 * time.Second}
)

type jwtPayload struct {
	ID  string `json:"id"`
	Exp int64  `json:"exp"`
}

func parseJWTPayload(token string) (*jwtPayload, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, errors.New("format token tidak valid")
	}
	segment := parts[1]
	switch len(segment) % 4 {
	case 2:
		segment += "=="
	case 3:
		segment += "="
	}
	raw, err := base64.URLEncoding.DecodeString(segment)
	if err != nil {
		raw, err = base64.RawURLEncoding.DecodeString(parts[1])
		if err != nil {
			return nil, err
		}
	}
	var p jwtPayload
	if err := json.Unmarshal(raw, &p); err != nil {
		return nil, err
	}
	return &p, nil
}

func verifyRemoteToken(token string) (*RemoteUser, bool) {
	remoteURL := os.Getenv("REMOTE_PB_URL")
	if remoteURL == "" {
		remoteURL = os.Getenv("PUBLIC_PB_URL")
	}
	if remoteURL == "" || !strings.HasPrefix(remoteURL, "http") {
		return nil, false
	}

	payload, err := parseJWTPayload(token)
	if err != nil {
		return nil, false
	}
	if payload.Exp > 0 && time.Now().Unix() > payload.Exp {
		return nil, false
	}

	if val, ok := tokenCache.Load(token); ok {
		if u, ok := val.(*RemoteUser); ok {
			return u, true
		}
	}

	baseURL := strings.TrimRight(remoteURL, "/")

	if payload.ID != "" {
		reqURL := baseURL + "/api/collections/users/records/" + payload.ID
		req, err := http.NewRequest(http.MethodGet, reqURL, nil)
		if err == nil {
			req.Header.Set("Authorization", "Bearer "+token)
			resp, err := remoteClient.Do(req)
			if err == nil && resp.StatusCode == http.StatusOK {
				defer resp.Body.Close()
				var record struct {
					ID          string `json:"id"`
					Email       string `json:"email"`
					Name        string `json:"name"`
					HouseholdID string `json:"household_id"`
				}
				if json.NewDecoder(resp.Body).Decode(&record) == nil && record.ID != "" {
					u := &RemoteUser{
						ID:          record.ID,
						Email:       record.Email,
						Name:        record.Name,
						HouseholdID: record.HouseholdID,
					}
					if u.HouseholdID == "" {
						hReq, hErr := http.NewRequest(http.MethodGet, baseURL+"/api/collections/households/records?filter=(created_by='"+u.ID+"')", nil)
						if hErr == nil {
							hReq.Header.Set("Authorization", "Bearer "+token)
							if hResp, err := remoteClient.Do(hReq); err == nil && hResp.StatusCode == http.StatusOK {
								defer hResp.Body.Close()
								var hData struct {
									Items []struct {
										ID string `json:"id"`
									} `json:"items"`
								}
								if json.NewDecoder(hResp.Body).Decode(&hData) == nil && len(hData.Items) > 0 {
									u.HouseholdID = hData.Items[0].ID
								}
							}
						}
					}
					tokenCache.Store(token, u)
					return u, true
				}
			} else if resp != nil {
				_ = resp.Body.Close()
			}
		}
	}

	req, err := http.NewRequest(http.MethodPost, baseURL+"/api/collections/users/auth-refresh", nil)
	if err != nil {
		return nil, false
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := remoteClient.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return nil, false
	}
	defer resp.Body.Close()

	var data struct {
		Record struct {
			ID          string `json:"id"`
			Email       string `json:"email"`
			Name        string `json:"name"`
			HouseholdID string `json:"household_id"`
		} `json:"record"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, false
	}

	u := &RemoteUser{
		ID:          data.Record.ID,
		Email:       data.Record.Email,
		Name:        data.Record.Name,
		HouseholdID: data.Record.HouseholdID,
	}

	tokenCache.Store(token, u)
	return u, true
}

func AuthGuard(app App) fiber.Handler {
	return func(c fiber.Ctx) error {
		token := bearerToken(c)
		if token == "" {
			return apierr.Fail(c, apierr.Unauthorized("Token tidak ditemukan"))
		}

		if _, err := app.FindCollectionByNameOrId(collections.ColUsers); err != nil {
			return apierr.Fail(c, apierr.Internal("Koleksi user tidak ditemukan"))
		}

		record, err := app.FindAuthRecordByToken(token, collections.ColUsers)
		if err != nil || record == nil {
			if rUser, ok := verifyRemoteToken(token); ok {
				c.Locals("user_id", rUser.ID)
				c.Locals("household_id", rUser.HouseholdID)
				c.Locals("remote_user", rUser)
				return c.Next()
			}
			return apierr.Fail(c, apierr.Unauthorized("Token tidak valid atau sudah kedaluwarsa"))
		}

		c.Locals("user", record)
		c.Locals("user_id", record.Id)
		c.Locals("household_id", householdOf(record))

		return c.Next()
	}
}

func HouseholdID(c fiber.Ctx) string {
	v, _ := c.Locals("household_id").(string)
	return v
}

func UserID(c fiber.Ctx) string {
	if id, ok := c.Locals("user_id").(string); ok && id != "" {
		return id
	}
	rec, _ := c.Locals("user").(*core.Record)
	if rec == nil {
		return ""
	}
	return rec.Id
}

// UserRecord mengambil record user yang sedang login.
func UserRecord(c fiber.Ctx) *core.Record {
	rec, _ := c.Locals("user").(*core.Record)
	return rec
}

func bearerToken(c fiber.Ctx) string {
	header := c.Get(fiber.HeaderAuthorization)
	if header == "" {
		return ""
	}
	parts := strings.Fields(header)
	if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
		return parts[1]
	}
	return ""
}

// householdOf membaca household_id dari record user, dengan fallback ke id
// sendiri agar record yang belum sempat di-hook tetap punya household valid.
func householdOf(rec *core.Record) string {
	if rec == nil {
		return ""
	}
	if h := rec.GetString("household_id"); h != "" {
		return h
	}
	return rec.Id
}

// CORS mengizinkan hanya origin yang terdaftar. Daftar origin yang kosong akan
// memakai wildcard, berguna saat development.
func CORS(allowed []string) fiber.Handler {
	set := make(map[string]struct{}, len(allowed))
	for _, o := range allowed {
		set[o] = struct{}{}
	}
	wildcard := len(allowed) == 0

	return func(c fiber.Ctx) error {
		origin := c.Get(fiber.HeaderOrigin)
		if origin == "" {
			return c.Next()
		}

		if _, ok := set[origin]; ok || wildcard {
			c.Set(fiber.HeaderAccessControlAllowOrigin, origin)
			c.Set(fiber.HeaderAccessControlAllowCredentials, "true")
			c.Set(fiber.HeaderAccessControlAllowHeaders, "Authorization, Content-Type, X-Client")
			c.Set(fiber.HeaderAccessControlAllowMethods, "GET, POST, PATCH, PUT, DELETE, OPTIONS")
			c.Set(fiber.HeaderAccessControlMaxAge, "86400")
		}

		if c.Method() == fiber.MethodOptions {
			return c.SendStatus(http.StatusNoContent)
		}

		return c.Next()
	}
}

func clientIP(c fiber.Ctx) string {
	if cf := c.Get("CF-Connecting-IP"); cf != "" {
		return cf
	}
	if xff := c.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	if xri := c.Get("X-Real-IP"); xri != "" {
		return xri
	}
	return c.IP()
}

// RateLimit membatasi jumlah request per menit per IP dengan fixed window.
func RateLimit(perMinute int) fiber.Handler {
	if perMinute <= 0 {
		perMinute = 120
	}

	type window struct {
		count int
		reset time.Time
	}

	var mu sync.Mutex
	hits := make(map[string]window)

	return func(c fiber.Ctx) error {
		if c.Method() == fiber.MethodOptions {
			return c.Next()
		}

		key := clientIP(c)
		now := time.Now()

		mu.Lock()
		w := hits[key]
		if now.After(w.reset) {
			w = window{reset: now.Add(time.Minute)}
		}
		w.count++
		hits[key] = w
		overLimit := w.count > perMinute
		remaining := perMinute - w.count

		if len(hits) > 10_000 {
			for k, v := range hits {
				if now.After(v.reset) {
					delete(hits, k)
				}
			}
		}
		mu.Unlock()

		c.Set("X-RateLimit-Limit", strconv.Itoa(perMinute))
		c.Set("X-RateLimit-Remaining", strconv.Itoa(max(remaining, 0)))

		if overLimit {
			c.Set("Retry-After", "60")
			return apierr.Fail(c, apierr.TooManyRequests("Terlalu banyak permintaan, coba lagi sebentar"))
		}

		return c.Next()
	}
}

func RequestLogger() fiber.Handler {
	return func(c fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		duration := time.Since(start)

		status := c.Response().StatusCode()
		method := c.Method()
		path := c.Path()

		LogHTTP("api", method, path, status, duration)

		if err != nil {
			var appErr *apierr.Error
			if errors.As(err, &appErr) && appErr.Status >= 500 {
				slog.Error("request gagal", "method", method, "path", path, "error", err)
			}
		}
		return err
	}
}
