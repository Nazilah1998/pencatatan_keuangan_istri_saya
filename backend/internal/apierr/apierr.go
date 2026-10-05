package apierr

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/gofiber/fiber/v3"
)

// Error adalah error internal yang sudah dipetakan ke status HTTP tertentu.
type Error struct {
	Status  int
	Code    string
	Message string
	Err     error
}

func (e *Error) Error() string {
	if e.Err != nil {
		return e.Message + ": " + e.Err.Error()
	}
	return e.Message
}

func (e *Error) Unwrap() error { return e.Err }

// New membuat *Error dengan pesan yang aman ditampilkan ke pengguna.
func New(status int, code, message string) *Error {
	return &Error{Status: status, Code: code, Message: message}
}

// Wrap membungkus error yang sudah ada dengan pesan yang aman ditampilkan.
func Wrap(status int, code, message string, err error) *Error {
	return &Error{Status: status, Code: code, Message: message, Err: err}
}

// Konstruktor umum.
func BadRequest(message string) *Error { return New(http.StatusBadRequest, "bad_request", message) }
func Unauthorized(message string) *Error {
	return New(http.StatusUnauthorized, "unauthorized", message)
}
func Forbidden(message string) *Error { return New(http.StatusForbidden, "forbidden", message) }
func NotFound(message string) *Error  { return New(http.StatusNotFound, "not_found", message) }
func Conflict(message string) *Error  { return New(http.StatusConflict, "conflict", message) }
func TooManyRequests(message string) *Error {
	return New(http.StatusTooManyRequests, "rate_limited", message)
}
func Internal(message string) *Error {
	return New(http.StatusInternalServerError, "internal_error", message)
}
func Upstream(message string) *Error {
	return New(http.StatusBadGateway, "upstream_error", message)
}

// Envelope adalah bentuk respons JSON yang seragam untuk seluruh backend.
type Envelope struct {
	OK    bool  `json:"ok"`
	Error *Body `json:"error,omitempty"`
	Data  any   `json:"data,omitempty"`
	Meta  *Meta `json:"meta,omitempty"`
}

// Body memuat detail error yang aman untuk pengguna.
type Body struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Meta memuat informasi tambahan seperti paginasi.
type Meta struct {
	Total int `json:"total"`
}

// Fail menulis respons error terstandar dan menghentikan rantai handler.
func Fail(c fiber.Ctx, err error) error {
	var appErr *Error
	if !errors.As(err, &appErr) {
		slog.Error("error tidak terpetakan", "error", err, "path", c.Path())
		appErr = Internal("Terjadi kesalahan pada server")
	}

	if appErr.Status >= http.StatusInternalServerError {
		slog.Error("kesalahan server", "code", appErr.Code, "error", appErr.Err, "path", c.Path())
	}

	return c.Status(appErr.Status).JSON(Envelope{
		OK: false,
		Error: &Body{
			Code:    appErr.Code,
			Message: appErr.Message,
		},
	})
}

// OK menulis respons sukses dengan bentuk yang sama.
func OK(c fiber.Ctx, data any) error {
	return c.JSON(Envelope{OK: true, Data: data})
}
