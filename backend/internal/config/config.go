package config

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config berisi seluruh konfigurasi runtime backend. Semua nilai dibaca dari
// environment variable supaya tidak ada secret yang tertanam di binary.
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

	TurnstileSecret    string
	TurnstileHostnames []string

	Dev bool
}

func loadEnvFile() {
	candidates := []string{".env", "../.env", "../../.env"}
	for _, p := range candidates {
		f, err := os.Open(p)
		if err != nil {
			continue
		}
		defer f.Close()

		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) != 2 {
				continue
			}
			k := strings.TrimSpace(parts[0])
			v := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
			if os.Getenv(k) == "" {
				_ = os.Setenv(k, v)
			}
		}
		if err := scanner.Err(); err != nil {
			_ = err
		}
		break
	}
}

// Load membaca konfigurasi dari environment.
func Load() *Config {
	loadEnvFile()

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

		CORSOrigin: splitCSV(os.Getenv("CORS_ORIGINS")),

		RateLimitPerMin: envInt("RATE_LIMIT_PER_MIN", 120),
		SiteDomain:      os.Getenv("SITE_DOMAIN"),

		TurnstileSecret:    os.Getenv("TURNSTILE_SECRET"),
		TurnstileHostnames: splitCSV(os.Getenv("TURNSTILE_HOSTNAMES")),

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
