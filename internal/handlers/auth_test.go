package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	authsession "refentra/internal/auth"

	"github.com/labstack/echo/v4"
)

func newTestAuthHandler() *AuthHandler {
	service := authsession.NewService(authsession.NewMemorySessionStore(), authsession.Config{
		JWTSecret:         "test-secret",
		AccessTTL:         15 * time.Minute,
		RefreshTTL:        24 * time.Hour,
		AccessCookieName:  "refentra_access_token",
		RefreshCookieName: "refentra_refresh_token",
		CookieSecure:      false,
		CookieSameSite:    http.SameSiteLaxMode,
		MockEmail:         "dev@refentra.com",
		MockPassword:      "password123",
	})

	return &AuthHandler{Service: service}
}

func TestLoginReturnsUserAndSetsCookies(t *testing.T) {
	e := echo.New()
	body := bytes.NewBufferString(`{"email":"dev@refentra.com","password":"password123"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", body)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	handler := newTestAuthHandler()

	if err := handler.Login(ctx); err != nil {
		t.Fatalf("Login returned error: %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var responseBody map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &responseBody); err != nil {
		t.Fatalf("failed to decode response body: %v", err)
	}

	if responseBody["id"] != "user-1234" || responseBody["email"] != "dev@refentra.com" || responseBody["name"] != "김개발" {
		t.Fatalf("unexpected body: %#v", responseBody)
	}

	cookies := rec.Result().Cookies()
	if len(cookies) != 2 {
		t.Fatalf("expected 2 auth cookies, got %d", len(cookies))
	}
}

func TestGetMeRequiresAuthentication(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	handler := newTestAuthHandler()

	if err := handler.GetMe(ctx); err != nil {
		t.Fatalf("GetMe returned error: %v", err)
	}

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rec.Code)
	}
}

func TestRefreshWithoutCookieReturnsAuthRequired(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	handler := newTestAuthHandler()

	if err := handler.Refresh(ctx); err != nil {
		t.Fatalf("Refresh returned error: %v", err)
	}

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rec.Code)
	}
}
