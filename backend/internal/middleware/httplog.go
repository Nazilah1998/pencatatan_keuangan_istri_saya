package middleware

import (
	"fmt"
	"os"
	"strings"
	"time"
)

const (
	colorReset  = "\033[0m"
	colorRed    = "\033[31m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorBlue   = "\033[34m"
	colorCyan   = "\033[36m"
	colorGray   = "\033[90m"
)

func LogHTTP(prefix, method, path string, status int, duration time.Duration) {
	if strings.HasPrefix(path, "/_/") || path == "/favicon.ico" {
		return
	}

	var statusColor string
	switch {
	case status >= 500:
		statusColor = colorRed
	case status >= 400:
		statusColor = colorYellow
	case status >= 300:
		statusColor = colorBlue
	default:
		statusColor = colorGreen
	}

	durationStr := formatDuration(duration)

	timestamp := time.Now().Format("15.04.05")
	fmt.Fprintf(os.Stdout, "%s%s%s [%s%d%s] %s %-6s %s %s%s%s\n",
		colorGray, timestamp, colorReset,
		statusColor, status, colorReset,
		colorCyan+prefix+colorReset,
		method,
		path,
		colorGray, durationStr, colorReset,
	)
}

func formatDuration(d time.Duration) string {
	if d < time.Millisecond {
		return fmt.Sprintf("%.2fms", float64(d.Microseconds())/1000.0)
	}
	if d < time.Second {
		return fmt.Sprintf("%.2fms", float64(d.Milliseconds()))
	}
	return fmt.Sprintf("%.2fs", d.Seconds())
}
