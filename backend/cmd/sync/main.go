package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/pocketbase/pocketbase"
	"sintya-finance/backend/internal/collections"
)

type AuthResponse struct {
	Token string `json:"token"`
}

func loadRootEnv() {
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

func main() {
	loadRootEnv()

	remoteURL := os.Getenv("REMOTE_PB_URL")
	if remoteURL == "" {
		log.Fatal("konfigurasi belum lengkap: REMOTE_PB_URL wajib disetel di file .env")
	}
	adminEmail := os.Getenv("PB_ADMIN_EMAIL")
	if adminEmail == "" {
		log.Fatal("konfigurasi belum lengkap: PB_ADMIN_EMAIL wajib disetel di file .env")
	}
	adminPassword := os.Getenv("PB_ADMIN_PASSWORD")
	if adminPassword == "" {
		log.Fatal("konfigurasi belum lengkap: PB_ADMIN_PASSWORD wajib disetel di file .env")
	}

	tempDir, err := os.MkdirTemp("", "pb_sync_*")
	if err != nil {
		log.Fatalf("buat temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	pb := pocketbase.NewWithConfig(pocketbase.Config{
		DefaultDataDir:  tempDir,
		HideStartBanner: true,
	})

	if err := pb.Bootstrap(); err != nil {
		log.Fatalf("bootstrap lokal pb: %v", err)
	}
	defer pb.ClearBootstrap()

	results, err := collections.Apply(pb)
	if err != nil {
		log.Fatalf("apply koleksi: %v", err)
	}
	fmt.Printf("Skema lokal berhasil diterapkan (%d koleksi diproses)\n", len(results))

	cols, err := pb.FindAllCollections()
	if err != nil {
		log.Fatalf("ambil koleksi: %v", err)
	}

	loginBody, _ := json.Marshal(map[string]string{
		"identity": adminEmail,
		"password": adminPassword,
	})
	resp, err := http.Post(remoteURL+"/api/collections/_superusers/auth-with-password", "application/json", bytes.NewReader(loginBody))
	if err != nil {
		log.Fatalf("login ke remote gagal: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Fatalf("login gagal (status %d): %s", resp.StatusCode, string(body))
	}

	var auth AuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&auth); err != nil {
		log.Fatalf("decode auth: %v", err)
	}
	for _, col := range cols {
		if col.IsAuth() {
			for i, p := range col.OAuth2.Providers {
				if p.Name == "google" && p.ClientSecret == "" {
					col.OAuth2.Providers[i].ClientSecret = os.Getenv("GOOGLE_CLIENT_SECRET")
				}
			}
		}
	}

	importPayload, err := json.Marshal(map[string]any{
		"collections":   cols,
		"deleteMissing": false,
	})
	if err != nil {
		log.Fatalf("marshal payload import: %v", err)
	}

	var rawPayload map[string]any
	if err := json.Unmarshal(importPayload, &rawPayload); err == nil {
		if rawCols, ok := rawPayload["collections"].([]any); ok {
			for _, rc := range rawCols {
				if colMap, ok := rc.(map[string]any); ok && colMap["name"] == "users" {
					if oauth2Map, ok := colMap["oauth2"].(map[string]any); ok {
						if provs, ok := oauth2Map["providers"].([]any); ok {
							for _, p := range provs {
								if pMap, ok := p.(map[string]any); ok && pMap["name"] == "google" {
									pMap["clientSecret"] = os.Getenv("GOOGLE_CLIENT_SECRET")
								}
							}
						}
					}
				}
			}
			importPayload, _ = json.Marshal(rawPayload)
		}
	}

	req, err := http.NewRequest(http.MethodPut, remoteURL+"/api/collections/import", bytes.NewReader(importPayload))
	if err != nil {
		log.Fatalf("buat request import: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+auth.Token)

	client := &http.Client{}
	importResp, err := client.Do(req)
	if err != nil {
		log.Fatalf("eksekusi import: %v", err)
	}
	defer importResp.Body.Close()

	respBody, _ := io.ReadAll(importResp.Body)
	if importResp.StatusCode != http.StatusOK && importResp.StatusCode != http.StatusNoContent {
		log.Fatalf("import gagal (status %d): %s", importResp.StatusCode, string(respBody))
	}

	fmt.Printf("SUKSES: Seluruh koleksi (%d) berhasil disinkronkan ke %s!\n", len(cols), remoteURL)

	schemaDir := filepath.Join("..", "backend", "bin")
	_ = os.MkdirAll(schemaDir, 0755)
	_ = os.WriteFile(filepath.Join(schemaDir, "pb_schema.json"), importPayload, 0644)
}
