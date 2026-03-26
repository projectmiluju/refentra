package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestGetStatusWithoutDatabaseReturnsServiceUnavailable(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	handler := &HealthHandler{}

	if err := handler.GetStatus(ctx); err != nil {
		t.Fatalf("GetStatus returned error: %v", err)
	}

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status 503, got %d", rec.Code)
	}
}
