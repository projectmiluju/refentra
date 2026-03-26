package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestGetMeReturnsMockUser(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	handler := &AuthHandler{}

	if err := handler.GetMe(ctx); err != nil {
		t.Fatalf("GetMe returned error: %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	expected := `{"email":"dev@refentra.com","id":"user-1234","name":"김개발"}`
	if rec.Body.String() != expected+"\n" {
		t.Fatalf("expected body %s, got %s", expected, rec.Body.String())
	}
}
