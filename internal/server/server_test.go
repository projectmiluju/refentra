package server

import (
	"crypto/tls"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestAllowedOriginReceivesCORSHeaders(t *testing.T) {
	t.Parallel()

	securityConfig := DefaultSecurityConfig()
	securityConfig.CORSAllowOrigins = []string{"https://refentra.example.com"}

	srv := NewServer(nil, nil, nil, nil, securityConfig)
	req := httptest.NewRequest(http.MethodOptions, "/api/v1/health", nil)
	req.Header.Set(echoHeaderOrigin, "https://refentra.example.com")
	req.Header.Set(echoHeaderAccessControlRequestMethod, http.MethodGet)
	rec := httptest.NewRecorder()

	srv.Echo.ServeHTTP(rec, req)

	if got := rec.Header().Get(echoHeaderAccessControlAllowOrigin); got != "https://refentra.example.com" {
		t.Fatalf("expected access-control-allow-origin header to be set, got %q", got)
	}

	if got := rec.Header().Get(echoHeaderVary); got == "" {
		t.Fatal("expected vary header to be set for CORS response")
	}
}

func TestDisallowedOriginDoesNotReceiveCORSHeaders(t *testing.T) {
	t.Parallel()

	securityConfig := DefaultSecurityConfig()
	securityConfig.CORSAllowOrigins = []string{"https://refentra.example.com"}

	srv := NewServer(nil, nil, nil, nil, securityConfig)
	req := httptest.NewRequest(http.MethodOptions, "/api/v1/health", nil)
	req.Header.Set(echoHeaderOrigin, "https://malicious.example.com")
	req.Header.Set(echoHeaderAccessControlRequestMethod, http.MethodGet)
	rec := httptest.NewRecorder()

	srv.Echo.ServeHTTP(rec, req)

	if got := rec.Header().Get(echoHeaderAccessControlAllowOrigin); got != "" {
		t.Fatalf("expected no access-control-allow-origin header, got %q", got)
	}
}

func TestSecurityHeadersAreSet(t *testing.T) {
	t.Parallel()

	securityConfig := DefaultSecurityConfig()
	securityConfig.EnableHSTS = true

	srv := NewServer(nil, nil, nil, nil, securityConfig)
	req := httptest.NewRequest(http.MethodGet, "https://refentra.example.com/api/v1/health", nil)
	req.TLS = &tls.ConnectionState{}
	rec := httptest.NewRecorder()

	srv.Echo.ServeHTTP(rec, req)

	assertHeader(t, rec, "X-Content-Type-Options", "nosniff")
	assertHeader(t, rec, "X-Frame-Options", "DENY")
	assertHeader(t, rec, "X-XSS-Protection", "1; mode=block")
	assertHeader(t, rec, "Content-Security-Policy", securityConfig.ContentSecurityPolicy)
	assertHeader(t, rec, "Strict-Transport-Security", "max-age=31536000; includeSubdomains")
}

func TestRateLimitingBlocksRepeatedAuthenticatedEndpointRequests(t *testing.T) {
	t.Parallel()

	securityConfig := DefaultSecurityConfig()
	securityConfig.RateLimitRequests = 1
	securityConfig.RateLimitWindow = time.Minute

	srv := NewServer(nil, nil, nil, nil, securityConfig)

	firstReq := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	firstReq.RemoteAddr = "192.0.2.10:1234"
	firstRec := httptest.NewRecorder()
	srv.Echo.ServeHTTP(firstRec, firstReq)

	secondReq := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	secondReq.RemoteAddr = "192.0.2.10:5678"
	secondRec := httptest.NewRecorder()
	srv.Echo.ServeHTTP(secondRec, secondReq)

	if firstRec.Code == http.StatusTooManyRequests {
		t.Fatalf("expected first request to pass rate limiter, got %d", firstRec.Code)
	}

	if secondRec.Code != http.StatusTooManyRequests {
		t.Fatalf("expected second request to be rate limited, got %d", secondRec.Code)
	}

	assertHeader(t, secondRec, "Retry-After", "60")
}

func assertHeader(t *testing.T, rec *httptest.ResponseRecorder, key string, want string) {
	t.Helper()

	if got := rec.Header().Get(key); got != want {
		t.Fatalf("expected %s to be %q, got %q", key, want, got)
	}
}
