package services

import "time"

// nowUTC mengembalikan waktu sekarang dalam format RFC3339 yang konsisten
// dipakai di seluruh payload ekspor.
func nowUTC() string {
	return time.Now().UTC().Format(time.RFC3339)
}
