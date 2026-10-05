package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config berisi seluruh konfigurasi runtime backend. Semua nilai dibaca dari
// environment variable (lihat ops/.env.example) supaya tidak ada secret yang
// tertanam di binary.
type Config struct {
	Env           string
	DataDir       string
	AdminEmail    string
	AdminPassword string

	GoogleClientID     string
	GoogleClientSecret string
	GeminiAPIKey       string

	PBPort     string
	APIPort    string
	CORSOrigin []string

	RateLimitPerMin int
	SiteDomain      string

	Dev bool
}

// Load membaca konfigurasi dari environment. Nilai yang tidak ada dibiarkan
// kosong; validasi ketat dilakukan oleh Validate agar bisa dipanggil terpisah
// (mis. pada saat start proses, bukan pada package init).
func Load() *Config {
	return &Config{
		Env:     env("APP_ENV", "development"),
		DataDir: env("PB_DATA_DIR", "./pb_data"),

		AdminEmail:    os.Getenv("PB_ADMIN_EMAIL"),
		AdminPassword: os.Getenv("PB_ADMIN_PASSWORD"),

		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GeminiAPIKey:       os.Getenv("GEMINI_API_KEY"),

		PBPort:  env("PB_PORT", "8080"),
		APIPort: env("API_PORT", "8081"),

		CORSOrigin: splitCSV(env("CORS_ORIGINS",
			"http://localhost:3000,http://localhost:4321,http://192.168.100.9:3000,capacitor://localhost,capacitor://ios")),

		RateLimitPerMin: envInt("RATE_LIMIT_PER_MIN", 120),
		SiteDomain:      env("SITE_DOMAIN", ""),

		Dev: env("APP_ENV", "development") == "development",
	}
}

// IsProduction memberi tahu apakah APP_ENV bernilai production.
func (c *Config) IsProduction() bool { return c.Env == "production" }

// Validate memastikan konfigurasi minimum untuk berjalan ada.
func (c *Config) Validate() error {
	var missing []string

	if c.DataDir == "" {
		missing = append(missing, "PB_DATA_DIR")
	}
	if !c.IsProduction() {
		if c.AdminEmail == "" {
			missing = append(missing, "PB_ADMIN_EMAIL")
		}
		if c.AdminPassword == "" {
			missing = append(missing, "PB_ADMIN_PASSWORD")
		}
	}

	if len(missing) > 0 {
		return fmt.Errorf("konfigurasi belum lengkap: %s", strings.Join(missing, ", "))
	}

	if c.PBPort == c.APIPort {
		return fmt.Errorf("PB_PORT dan API_PORT tidak boleh sama (keduanya %s)", c.PBPort)
	}

	return nil
}

// PBAddress mengembalikan alamat listener PocketBase.
func (c *Config) PBAddress() string { return "0.0.0.0:" + c.PBPort }

// APIAddress mengembalikan alamat listener Go Fiber.
func (c *Config) APIAddress() string { return "0.0.0.0:" + c.APIPort }

// RequestTimeout adalah batas waktu satu request business logic.
func (c *Config) RequestTimeout() time.Duration { return 30 * time.Second }

func env(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) int {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}

func splitCSV(raw string) []string {
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}
