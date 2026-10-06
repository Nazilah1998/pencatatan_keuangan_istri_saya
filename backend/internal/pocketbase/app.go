package pocketbase

import (
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"

	"sintya-finance/backend/internal/collections"
	"sintya-finance/backend/internal/config"
	"sintya-finance/backend/internal/hooks"
	"sintya-finance/backend/internal/middleware"
)

// New membuat dan membootstrap instance PocketBase yang ter-embed.
//
// Urutannya penting: Bootstrap() membuka koneksi SQLite dan menjalankan
// migrasi internal lebih dulu, baru Apply() berjalan agar tabel koleksi
// benar-benar ada.
func New(cfg *config.Config) (*pocketbase.PocketBase, error) {
	pb := pocketbase.NewWithConfig(pocketbase.Config{
		HideStartBanner:     true,
		DefaultDev:          false,
		DefaultDataDir:      cfg.DataDir,
		DefaultQueryTimeout: 30,
		DataMaxOpenConns:    8,
		DataMaxIdleConns:    4,
		AuxMaxOpenConns:     4,
		AuxMaxIdleConns:     2,
	})

	if err := pb.Bootstrap(); err != nil {
		return nil, fmt.Errorf("bootstrap pocketbase: %w", err)
	}

	if db, ok := pb.ConcurrentDB().(*dbx.DB); ok {
		db.QueryLogFunc = nil
		db.ExecLogFunc = nil
	}
	if db, ok := pb.NonconcurrentDB().(*dbx.DB); ok {
		db.QueryLogFunc = nil
		db.ExecLogFunc = nil
	}
	if db, ok := pb.AuxConcurrentDB().(*dbx.DB); ok {
		db.QueryLogFunc = nil
		db.ExecLogFunc = nil
	}
	if db, ok := pb.AuxNonconcurrentDB().(*dbx.DB); ok {
		db.QueryLogFunc = nil
		db.ExecLogFunc = nil
	}

	pb.OnServe().BindFunc(func(e *core.ServeEvent) error {
		e.Router.BindFunc(func(re *core.RequestEvent) error {
			start := time.Now()
			err := re.Next()
			duration := time.Since(start)
			middleware.LogHTTP("pb", re.Request.Method, re.Request.URL.Path, re.Status(), duration)
			return err
		})
		return e.Next()
	})

	hooks.Register(pb)
	go hooks.StartBackgroundJobs(pb)

	if err := ApplySchema(pb); err != nil {
		_ = pb.ClearBootstrap()
		return nil, err
	}

	// Akun admin bersifat opsional:PB_ADMIN_EMAIL bisa dikosongkan pada
	// environment lokal agar tidak ada kredensial hardcoded.
	if cfg.AdminEmail != "" || cfg.AdminPassword != "" {
		if err := EnsureSuperuser(pb, cfg.AdminEmail, cfg.AdminPassword); err != nil {
			slog.Warn("admin tidak dibuat", "alasan", err)
		}
	}

	return pb, nil
}

// ApplySchema menyelaraskan koleksi lalu memastikan superuser admin ada.
// Dipisahkan agar bisa dipanggil ulang tanpa membootstrap ulang database.
func ApplySchema(app core.App) error {
	results, err := collections.Apply(app)
	if err != nil {
		return err
	}

	for _, r := range results {
		switch r.Action {
		case collections.ActionCreated:
			slog.Info("koleksi dibuat", "nama", r.Name, "rincian", r.Detail)
		case collections.ActionUpdated:
			slog.Info("koleksi diperbarui", "nama", r.Name)
		default:
			slog.Debug("koleksi tidak berubah", "nama", r.Name)
		}
	}

	return nil
}

// EnsureSuperuser membuat akun admin PocketBase pertama bila belum ada.
//
// Akun admin hidup di koleksi internal "_superusers", bukan di koleksi users,
// sehingga admin tidak bisa ikut ter-scope oleh rule household. Password hanya
// dibaca dari environment dan tidak pernah disimpan di source code.
func EnsureSuperuser(app core.App, email, password string) error {
	if email == "" || password == "" {
		return errors.New("superuser: PB_ADMIN_EMAIL dan PB_ADMIN_PASSWORD wajib diisi")
	}
	if len(password) < 10 {
		return errors.New("superuser: password minimal 10 karakter")
	}

	col, err := app.FindCachedCollectionByNameOrId(core.CollectionNameSuperusers)
	if err != nil {
		return fmt.Errorf("superuser: koleksi admin: %w", err)
	}

	existing, err := app.FindAuthRecordByEmail(col, email)
	if err == nil && existing != nil {
		slog.Info("admin sudah ada", "email", email)
		return nil
	}
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return fmt.Errorf("superuser: cari admin: %w", err)
	}

	record := core.NewRecord(col)
	record.SetEmail(email)
	record.SetPassword(password)

	if err := app.Save(record); err != nil {
		return fmt.Errorf("superuser: buat admin: %w", err)
	}

	slog.Info("admin dibuat", "email", email)
	return nil
}

// EnsureDataDir membuat folder data PocketBase bila belum ada.
func EnsureDataDir(dataDir string) error {
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return fmt.Errorf("buat data dir %q: %w", dataDir, err)
	}
	return nil
}

// Shutdown menutup koneksi database dengan rapi.
func Shutdown(app core.App) {
	if app == nil {
		return
	}
	done := make(chan struct{})
	go func() {
		defer close(done)
		_ = app.ClearBootstrap()
	}()

	select {
	case <-done:
	case <-time.After(5 * time.Second):
		slog.Warn("shutdown pocketbase melewati batas waktu 5 detik")
	}
}
