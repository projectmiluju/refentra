package server

import (
	"net/http"
	"strings"
	"time"
)

const (
	defaultRateLimitRequests = 60
	defaultRateLimitWindow   = time.Minute
)

type SecurityConfig struct {
	CORSAllowOrigins     []string
	CORSAllowMethods     []string
	CORSAllowHeaders     []string
	CORSAllowCredentials bool
	RateLimitRequests    int
	RateLimitWindow      time.Duration
	EnableHSTS           bool
	ContentSecurityPolicy string
}

func DefaultSecurityConfig() SecurityConfig {
	return SecurityConfig{
		CORSAllowOrigins: []string{
			"http://localhost:4173",
			"http://127.0.0.1:4173",
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:8080",
			"http://127.0.0.1:8080",
		},
		CORSAllowMethods: []string{
			http.MethodGet,
			http.MethodHead,
			http.MethodPost,
			http.MethodOptions,
		},
		CORSAllowHeaders: []string{
			echoHeaderOrigin,
			echoHeaderContentType,
			echoHeaderAccept,
			echoHeaderAuthorization,
			echoHeaderXRequestedWith,
		},
		CORSAllowCredentials: true,
		RateLimitRequests:    defaultRateLimitRequests,
		RateLimitWindow:      defaultRateLimitWindow,
		EnableHSTS:           false,
		ContentSecurityPolicy: "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https:; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
	}
}

const (
	echoHeaderOrigin        = "Origin"
	echoHeaderContentType   = "Content-Type"
	echoHeaderAccept        = "Accept"
	echoHeaderAuthorization = "Authorization"
	echoHeaderXRequestedWith = "X-Requested-With"
	echoHeaderAccessControlRequestMethod = "Access-Control-Request-Method"
	echoHeaderAccessControlAllowOrigin   = "Access-Control-Allow-Origin"
	echoHeaderVary                       = "Vary"
)

func hstsMaxAge(enabled bool) int {
	if enabled {
		return 31536000
	}

	return 0
}

func ParseCSV(value string) []string {
	if strings.TrimSpace(value) == "" {
		return nil
	}

	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed == "" {
			continue
		}
		result = append(result, trimmed)
	}

	return result
}
