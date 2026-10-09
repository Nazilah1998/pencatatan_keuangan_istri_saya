package handlers

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/pocketbase/pocketbase/core"
	"golang.org/x/crypto/bcrypt"

	"sintya-finance/backend/internal/apierr"
	"sintya-finance/backend/internal/middleware"
)

// AuthStore adalah bagian dari core.App yang dibutuhkan handler PIN.
type AuthStore interface {
	Save(model core.Model) error
}

// Auth menangani pengaturan & verifikasi PIN aplikasi.
//
// PIN disimpan sebagai hash bcrypt pada users.pin_hash. Verifikasi selalu
// dilakukan di server sehingga hash tidak pernah dikirim ke browser dan tidak
// ada PIN yang tersimpan di localStorage.
type Auth struct {
	app AuthStore
}

// NewAuth membuat handler autentikasi tambahan.
func NewAuth(app AuthStore) *Auth { return &Auth{app: app} }

// Register mendaftarkan route PIN pada group yang dilindungi AuthGuard.
func (h *Auth) Register(router fiber.Router) {
	router.Get("/auth/pin", h.Status)
	router.Post("/auth/pin", h.SetPin)
	router.Post("/auth/pin/verify", h.VerifyPin)
	router.Delete("/auth/pin", h.RemovePin)
}

// PinStatusPayload memberi tahu frontend apakah PIN sudah aktif.
type PinStatusPayload struct {
	HasPin bool   `json:"has_pin"`
	Hint   string `json:"hint"`
}

type pinRequest struct {
	Pin       string `json:"pin"`
	OldPin    string `json:"old_pin"`
	Confirmed string `json:"confirmed"`
}

const minPinLength = 4

// Status mengembalikan apakah user sudah memasang PIN.
func (h *Auth) Status(c fiber.Ctx) error {
	rec := middleware.UserRecord(c)
	if rec == nil {
		if remote, ok := c.Locals("remote_user").(*middleware.RemoteUser); ok && remote != nil {
			return apierr.OK(c, PinStatusPayload{
				HasPin: false,
				Hint:   "",
			})
		}
		return apierr.Fail(c, apierr.Unauthorized("Sesi tidak valid"))
	}

	return apierr.OK(c, PinStatusPayload{
		HasPin: rec.GetString("pin_hash") != "",
		Hint:   pinHint(rec.GetString("pin_hash")),
	})
}

// SetPin memasang atau mengganti PIN. Mengganti PIN wajib menyertakan PIN lama
// sebagai bukti kepemilikan akun.
func (h *Auth) SetPin(c fiber.Ctx) error {
	rec := middleware.UserRecord(c)
	if rec == nil {
		if remote, ok := c.Locals("remote_user").(*middleware.RemoteUser); ok && remote != nil {
			return apierr.Fail(c, apierr.BadRequest("PIN belum didukung untuk sesi remote"))
		}
		return apierr.Fail(c, apierr.Unauthorized("Sesi tidak valid"))
	}

	var body pinRequest
	if err := c.Bind().JSON(&body); err != nil {
		return apierr.Fail(c, apierr.BadRequest("Format permintaan tidak valid"))
	}

	if err := validatePin(body.Pin, body.Confirmed); err != nil {
		return apierr.Fail(c, apierr.BadRequest(err.Error()))
	}

	existing := rec.GetString("pin_hash")

	if existing != "" {
		if err := bcrypt.CompareHashAndPassword([]byte(existing), []byte(body.OldPin)); err != nil {
			return apierr.Fail(c, apierr.Forbidden("PIN lama salah"))
		}
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(body.Pin), bcrypt.DefaultCost)
	if err != nil {
		return apierr.Fail(c, apierr.Internal("Gagal memproses PIN"))
	}

	rec.Set("pin_hash", string(hashed))
	if err := h.app.Save(rec); err != nil {
		return apierr.Fail(c, apierr.Internal("Gagal menyimpan PIN"))
	}

	return apierr.OK(c, PinStatusPayload{HasPin: true, Hint: pinHint(string(hashed))})
}

// VerifyPin memverifikasi PIN lalu mengembalikan token sesi PocketBase baru.
//
// Ini adalah mekanisme "unlock": frontend mengirim PIN, server mencocokkannya
// dengan hash, lalu mengembalikan token yang bisa dipakai untuk request lanjutan.
func (h *Auth) VerifyPin(c fiber.Ctx) error {
	rec := middleware.UserRecord(c)
	if rec == nil {
		return apierr.Fail(c, apierr.Unauthorized("Sesi tidak valid"))
	}

	hash := rec.GetString("pin_hash")
	if hash == "" {
		return apierr.Fail(c, apierr.BadRequest("PIN belum dipasang"))
	}

	var body pinRequest
	if err := c.Bind().JSON(&body); err != nil {
		return apierr.Fail(c, apierr.BadRequest("Format permintaan tidak valid"))
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(body.Pin)); err != nil {
		return apierr.Fail(c, apierr.Forbidden("PIN salah"))
	}

	token, err := rec.NewAuthToken()
	if err != nil {
		return apierr.Fail(c, apierr.Internal("Gagal membuat token sesi"))
	}

	return apierr.OK(c, fiber.Map{
		"token": token,
		"user": fiber.Map{
			"id":    rec.Id,
			"name":  rec.GetString("name"),
			"email": rec.Email(),
		},
	})
}

// RemovePin menghapus PIN setelah PIN lama diverifikasi.
func (h *Auth) RemovePin(c fiber.Ctx) error {
	rec := middleware.UserRecord(c)
	if rec == nil {
		if remote, ok := c.Locals("remote_user").(*middleware.RemoteUser); ok && remote != nil {
			return apierr.OK(c, PinStatusPayload{HasPin: false})
		}
		return apierr.Fail(c, apierr.Unauthorized("Sesi tidak valid"))
	}

	hash := rec.GetString("pin_hash")
	if hash == "" {
		return apierr.OK(c, PinStatusPayload{HasPin: false})
	}

	var body pinRequest
	if err := c.Bind().JSON(&body); err != nil {
		return apierr.Fail(c, apierr.BadRequest("Format permintaan tidak valid"))
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(body.Pin)); err != nil {
		return apierr.Fail(c, apierr.Forbidden("PIN salah"))
	}

	rec.Set("pin_hash", "")
	if err := h.app.Save(rec); err != nil {
		return apierr.Fail(c, apierr.Internal("Gagal menghapus PIN"))
	}

	return apierr.OK(c, PinStatusPayload{HasPin: false})
}

func validatePin(pin, confirmed string) error {
	if len(pin) < minPinLength {
		return errors.New("PIN minimal 4 karakter")
	}
	if len(pin) > 64 {
		return errors.New("PIN maksimal 64 karakter")
	}
	if confirmed != "" && !strings.EqualFold(pin, confirmed) {
		return errors.New("Konfirmasi PIN tidak sama")
	}
	return nil
}

// pinHint hanya memberi tahu status, tidak membocorkan isi PIN.
func pinHint(hash string) string {
	if hash == "" {
		return ""
	}
	return "terpasang"
}
