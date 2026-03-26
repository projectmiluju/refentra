package handlers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestGetReferencesWithoutDatabaseReturnsServiceUnavailable(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/references", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	handler := &ReferenceHandler{}

	if err := handler.GetReferences(ctx); err != nil {
		t.Fatalf("GetReferences returned error: %v", err)
	}

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status 503, got %d", rec.Code)
	}

	expected := `{"error":"Database connection is unavailable"}`
	if rec.Body.String() != expected+"\n" {
		t.Fatalf("expected body %s, got %s", expected, rec.Body.String())
	}
}

func TestCreateReferenceRejectsMissingRequiredFields(t *testing.T) {
	e := echo.New()
	body := bytes.NewBufferString(`{"url":" ","title":" "}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/references", body)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	handler := &ReferenceHandler{}

	if err := handler.CreateReference(ctx); err != nil {
		t.Fatalf("CreateReference returned error: %v", err)
	}

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rec.Code)
	}

	expected := `{"error":"URL and title are required"}`
	if rec.Body.String() != expected+"\n" {
		t.Fatalf("expected body %s, got %s", expected, rec.Body.String())
	}
}

func TestCreateReferenceWithoutDatabaseReturnsServiceUnavailable(t *testing.T) {
	e := echo.New()
	body := bytes.NewBufferString(`{"url":"https://example.com","title":"문서","description":"설명","tags":["Go"]}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/references", body)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	handler := &ReferenceHandler{}

	if err := handler.CreateReference(ctx); err != nil {
		t.Fatalf("CreateReference returned error: %v", err)
	}

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status 503, got %d", rec.Code)
	}

	expected := `{"error":"Database connection is unavailable"}`
	if rec.Body.String() != expected+"\n" {
		t.Fatalf("expected body %s, got %s", expected, rec.Body.String())
	}
}
