package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"

	"sintya-finance/backend/internal/apierr"
	"sintya-finance/backend/internal/config"
	"sintya-finance/backend/internal/handlers"
	"sintya-finance/backend/internal/middleware"
	"sintya-finance/backend/internal/pocketbase"
)

const (
	apiPrefix  = "/api/v1"
	shutdownAt = 10 * time.Second
)

func main() {
	if err := run(); err != nil {
		slog.Error("server berhenti", "alasan", err)
		os.Exit(1)
	}
}

func run() error {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))

	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		return err
	}

	if err := pocketbase.EnsureDataDir(cfg.DataDir); err != nil {
		return err
	}

	pbApp, err := pocketbase.New(cfg)
	if err != nil {
		return err
	}
	defer pocketbase.Shutdown(pbApp)

	app := buildAPI(cfg, pbApp)

	errCh := make(chan error, 2)

	go func() {
		slog.Info("pocketbase siap", "alamat", cfg.PBAddress(), "data", cfg.DataDir)

		// `pbApp.Start()` tidak dipakai: method itu menjalankan CLI PocketBase
		// (serve/superuser/version) dari os.Args, sehingga proses keluar dengan
		// banner bantuan alih-alih menyalakan listener. `apis.Serve` adalah
		// jalur embedded yang benar.
		err := apis.Serve(pbApp, apis.ServeConfig{
			HttpAddr:        cfg.PBAddress(),
			ShowStartBanner: false,
			AllowedOrigins:  cfg.CORSOrigin,
		})

		if err != nil && !errors.Is(err, context.Canceled) && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	go func() {
		slog.Info("api siap", "alamat", cfg.APIAddress())
		if err := app.Listen(cfg.APIAddress(), fiber.ListenConfig{DisableStartupMessage: false}); err != nil {
			errCh <- err
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	select {
	case sig := <-stop:
		slog.Info("sinyal diterima, menutup server", "sinyal", sig.String())
	case err := <-errCh:
		return err
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownAt)
	defer cancel()

	done := make(chan struct{})
	go func() {
		defer close(done)
		_ = app.ShutdownWithContext(shutdownCtx)
	}()

	select {
	case <-done:
		slog.Info("api berhenti")
	case <-shutdownCtx.Done():
		slog.Warn("api tidak berhenti dalam batas waktu")
	}

	return nil
}

// buildAPI merakit aplikasi Fiber beserta seluruh route-nya.
func buildAPI(cfg *config.Config, pbApp core.App) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "sintya-finance-api",
		ReadTimeout:  cfg.RequestTimeout(),
		WriteTimeout: cfg.RequestTimeout(),
		ErrorHandler: func(c fiber.Ctx, err error) error {
			if fbErr := new(fiber.Error); errors.As(err, &fbErr) {
				return apierr.Fail(c, apierr.New(fbErr.Code, mapFiberCode(fbErr.Code), fbErr.Message))
			}
			slog.Error("error tak terduga", "path", c.Path(), "error", err)
			return apierr.Fail(c, apierr.Internal("Terjadi kesalahan pada server"))
		},
	})

	app.Use(middleware.RequestLogger())
	app.Use(middleware.RateLimit(cfg.RateLimitPerMin))
	app.Use(middleware.CORS(cfg.CORSOrigin))

	app.Get(apiPrefix+"/health", func(c fiber.Ctx) error {
		return apierr.OK(c, fiber.Map{
			"status":  "ok",
			"env":     cfg.Env,
			"service": "sintya-finance-api",
			"time":    time.Now().UTC().Format(time.RFC3339),
		})
	})

	guard := middleware.AuthGuard(pbApp)

	app.Get(apiPrefix+"/me", guard, meHandler)

	reports := handlers.NewReports(pbApp)
	data := handlers.NewData(pbApp, pbApp)
	pin := handlers.NewAuth(pbApp)
	ai := handlers.NewAI(cfg.GeminiAPIKey, pbApp)

	protected := app.Group(apiPrefix, guard)
	reports.Register(protected)
	data.Register(protected)
	pin.Register(protected)
	ai.Register(protected)

	app.Use(func(c fiber.Ctx) error {
		return apierr.Fail(c, apierr.NotFound("Endpoint tidak ditemukan"))
	})

	return app
}

// mapFiberCode memetakan status Fiber ke kode error aplikasi.
func mapFiberCode(status int) string {
	switch status {
	case fiber.StatusNotFound:
		return "not_found"
	case fiber.StatusMethodNotAllowed:
		return "method_not_allowed"
	case fiber.StatusRequestEntityTooLarge:
		return "payload_too_large"
	default:
		return "request_failed"
	}
}

func meHandler(c fiber.Ctx) error {
	rec := middleware.UserRecord(c)
	if rec != nil {
		return apierr.OK(c, fiber.Map{
			"id":            rec.Id,
			"email":         rec.Email(),
			"name":          rec.GetString("name"),
			"language":      rec.GetString("language"),
			"household_id":  middleware.HouseholdID(c),
			"base_currency": rec.GetString("base_currency"),
			"has_pin":       rec.GetString("pin_hash") != "",
			"avatar":        rec.GetString("avatar"),
		})
	}

	remote, ok := c.Locals("remote_user").(*middleware.RemoteUser)
	if !ok || remote == nil {
		return apierr.Fail(c, apierr.Unauthorized("Sesi tidak valid"))
	}

	return apierr.OK(c, fiber.Map{
		"id":            remote.ID,
		"email":         remote.Email,
		"name":          remote.Name,
		"language":      "id",
		"household_id":  remote.HouseholdID,
		"base_currency": "IDR",
		"has_pin":       false,
		"avatar":        "",
	})
}
