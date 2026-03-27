package handlers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	authsession "refentra/internal/auth"

	"github.com/labstack/echo/v4"
)

func TestGetReferencesWithoutDatabaseReturnsServiceUnavailable(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/references", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set(authsession.ContextUserIDKey, "user-1234")

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

func TestGetReferencesRejectsInvalidPage(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/references?page=0", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set(authsession.ContextUserIDKey, "user-1234")

	handler := &ReferenceHandler{}

	if err := handler.GetReferences(ctx); err != nil {
		t.Fatalf("GetReferences returned error: %v", err)
	}

	if rec.Code != http.StatusServiceUnavailable && rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 or 503, got %d", rec.Code)
	}

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rec.Code)
	}

	expected := `{"error":"page must be a positive integer"}`
	if rec.Body.String() != expected+"\n" {
		t.Fatalf("expected body %s, got %s", expected, rec.Body.String())
	}
}

func TestGetReferencesRejectsInvalidLimit(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/references?limit=-1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set(authsession.ContextUserIDKey, "user-1234")

	handler := &ReferenceHandler{}

	if err := handler.GetReferences(ctx); err != nil {
		t.Fatalf("GetReferences returned error: %v", err)
	}

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rec.Code)
	}

	expected := `{"error":"limit must be a positive integer"}`
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
	ctx.Set(authsession.ContextUserIDKey, "user-1234")

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
	ctx.Set(authsession.ContextUserIDKey, "user-1234")

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

func TestNormalizeReferenceTagsSupportsRepeatedQueryValues(t *testing.T) {
	tags := normalizeReferenceTags([]string{"Go", "Frontend,React", "Go", "  "})

	expected := []string{"Go", "Frontend", "React"}
	if !reflect.DeepEqual(tags, expected) {
		t.Fatalf("expected tags %v, got %v", expected, tags)
	}
}
