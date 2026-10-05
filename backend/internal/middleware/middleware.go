package middleware

import (
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/pocketbase/pocketbase/core"

	"sintya-finance/backend/internal/apierr"
	"sintya-finance/backend/internal/collections"
)

// App adalah subset core.App yang dibutuhkan middleware. Dideklarasikan sebagai
// interface agar package ini tidak bergantung pada PocketBase secara langsung,
// sehingga mudah diuji dengan stub.
type App interface {
	FindCollectionByNameOrId(nameOrId string) (*core.Collection, error)
	FindAuthRecordByToken(token string, validTypes ...string) (*core.Record, error)
}

// AuthGuard memverifikasi token PocketBase pada setiap request. Token dibaca dari
// header Authorization, lalu record user dimuat dan household_id-nya disimpan di
// Locals supaya handler tidak perlu memuat ulang.
func AuthGuard(app App) fiber.Handler {
	return func(c fiber.Ctx) error {
		token := bearerToken(c)
		if token == "" {
			return apierr.Fail(c, apierr.Unauthorized("Token tidak ditemukan"))
		}

		// Koleksi users dicek lebih dulu agar token dari koleksi lain
		// (mis. admin PocketBase) tidak bisa dipakai accessing endpoint ini.
		if _, err := app.FindCollectionByNameOrId(collections.ColUsers); err != nil {
			return apierr.Fail(c, apierr.Internal("Koleksi user tidak ditemukan"))
		}

		record, err := app.FindAuthRecordByToken(token, collections.ColUsers)
		if err != nil || record == nil {
			return apierr.Fail(c, apierr.Unauthorized("Token tidak valid atau sudah kedaluwarsa"))
		}

		c.Locals("user", record)
		c.Locals("household_id", householdOf(record))

		return c.Next()
	}
}

// HouseholdID mengambil household_id yang sudah dipasang AuthGuard.
func HouseholdID(c fiber.Ctx) string {
	v, _ := c.Locals("household_id").(string)
	return v
}

// UserID mengambil id user yang sedang login.
func UserID(c fiber.Ctx) string {
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
		key := c.IP()
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

// RequestLogger mencatat kegagalan server agar mudah ditelusuri.
func RequestLogger() fiber.Handler {
	return func(c fiber.Ctx) error {
		err := c.Next()
		if err != nil {
			var appErr *apierr.Error
			if errors.As(err, &appErr) && appErr.Status >= 500 {
				slog.Error("request gagal", "method", c.Method(), "path", c.Path(), "error", err)
			}
		}
		return err
	}
}
