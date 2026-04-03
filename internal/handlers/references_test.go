package handlers

import (
	"bytes"
	"errors"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
	"time"

	authsession "refentra/internal/auth"
	"refentra/internal/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type fakeReferenceCreateStore struct {
	existing      *models.Reference
	findError     error
	saveError     error
	savedRef      *models.Reference
	ownedRef      *models.Reference
	deleteErr     error
	restoreErr    error
	deletedBy     string
	restoreUntil  time.Time
	restoreCalled bool
}

func (s *fakeReferenceCreateStore) FindDuplicateReference(string, string, string) (*models.Reference, error) {
	if s.findError != nil {
		return nil, s.findError
	}

	if s.existing == nil {
		return nil, gorm.ErrRecordNotFound
	}

	return s.existing, nil
}

func (s *fakeReferenceCreateStore) CreateReference(ref *models.Reference) error {
	if s.saveError != nil {
		return s.saveError
	}

	s.savedRef = ref
	return nil
}

func (s *fakeReferenceCreateStore) FindReferenceForOwner(string, string, bool) (*models.Reference, error) {
	if s.findError != nil {
		return nil, s.findError
	}

	if s.ownedRef == nil {
		return nil, gorm.ErrRecordNotFound
	}

	return s.ownedRef, nil
}

func (s *fakeReferenceCreateStore) SoftDeleteReference(ref *models.Reference, deletedBy string, restoreUntil time.Time) error {
	if s.deleteErr != nil {
		return s.deleteErr
	}

	s.deletedBy = deletedBy
	s.restoreUntil = restoreUntil
	ref.DeletedAt = gorm.DeletedAt{Time: time.Now().UTC(), Valid: true}
	ref.DeletedBy = &deletedBy
	ref.RestoreUntil = &restoreUntil
	return nil
}

func (s *fakeReferenceCreateStore) RestoreReference(ref *models.Reference) error {
	if s.restoreErr != nil {
		return s.restoreErr
	}

	s.restoreCalled = true
	ref.DeletedAt = gorm.DeletedAt{}
	ref.DeletedBy = nil
	ref.RestoreUntil = nil
	return nil
}

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

func TestCreateReferenceRejectsDuplicateReference(t *testing.T) {
	e := echo.New()
	body := bytes.NewBufferString(`{"url":"https://example.com","title":"Duplicate title","description":"note","tags":["Go"]}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/references", body)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set(authsession.ContextUserIDKey, "user-1234")

	handler := &ReferenceHandler{
		DB: &gorm.DB{},
		createStore: &fakeReferenceCreateStore{
			existing: &models.Reference{URL: "https://example.com", Title: "Duplicate title"},
		},
	}

	if err := handler.CreateReference(ctx); err != nil {
		t.Fatalf("CreateReference returned error: %v", err)
	}

	if rec.Code != http.StatusConflict {
		t.Fatalf("expected status 409, got %d", rec.Code)
	}

	expected := `{"error":"This reference already exists"}`
	if rec.Body.String() != expected+"\n" {
		t.Fatalf("expected body %s, got %s", expected, rec.Body.String())
	}
}

func TestCreateReferenceTrimsValuesBeforeSave(t *testing.T) {
	e := echo.New()
	body := bytes.NewBufferString(`{"url":" https://example.com ","title":" Trimmed title ","description":" note ","tags":["Go"]}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/references", body)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set(authsession.ContextUserIDKey, "user-1234")

	store := &fakeReferenceCreateStore{}
	handler := &ReferenceHandler{
		DB:          &gorm.DB{},
		createStore: store,
	}

	if err := handler.CreateReference(ctx); err != nil {
		t.Fatalf("CreateReference returned error: %v", err)
	}

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d", rec.Code)
	}

	if store.savedRef == nil {
		t.Fatal("expected reference to be saved")
	}

	if store.savedRef.URL != "https://example.com" {
		t.Fatalf("expected trimmed URL, got %q", store.savedRef.URL)
	}

	if store.savedRef.Title != "Trimmed title" {
		t.Fatalf("expected trimmed title, got %q", store.savedRef.Title)
	}

	if store.savedRef.Description != "note" {
		t.Fatalf("expected trimmed description, got %q", store.savedRef.Description)
	}
}

func TestCreateReferenceReturnsServerErrorWhenDuplicateCheckFails(t *testing.T) {
	e := echo.New()
	body := bytes.NewBufferString(`{"url":"https://example.com","title":"Title"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/references", body)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set(authsession.ContextUserIDKey, "user-1234")

	handler := &ReferenceHandler{
		DB: &gorm.DB{},
		createStore: &fakeReferenceCreateStore{
			findError: errors.New("db failure"),
		},
	}

	if err := handler.CreateReference(ctx); err != nil {
		t.Fatalf("CreateReference returned error: %v", err)
	}

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", rec.Code)
	}
}

func TestNormalizeReferenceTagsSupportsRepeatedQueryValues(t *testing.T) {
	tags := normalizeReferenceTags([]string{"Go", "Frontend,React", "Go", "  "})

	expected := []string{"Go", "Frontend", "React"}
	if !reflect.DeepEqual(tags, expected) {
		t.Fatalf("expected tags %v, got %v", expected, tags)
	}
}

func TestDeleteReferenceWithoutAuthenticationReturnsUnauthorized(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/references/ref-1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetPath("/api/v1/references/:id")
	ctx.SetParamNames("id")
	ctx.SetParamValues("ref-1")

	handler := &ReferenceHandler{}

	if err := handler.DeleteReference(ctx); err != nil {
		t.Fatalf("DeleteReference returned error: %v", err)
	}

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rec.Code)
	}
}

func TestDeleteReferenceSoftDeletesOwnedReference(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/references/ref-1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetPath("/api/v1/references/:id")
	ctx.SetParamNames("id")
	ctx.SetParamValues("ref-1")
	ctx.Set(authsession.ContextUserIDKey, "user-1234")

	store := &fakeReferenceCreateStore{
		ownedRef: &models.Reference{UploaderID: "user-1234"},
	}
	handler := &ReferenceHandler{
		DB:          &gorm.DB{},
		createStore: store,
	}

	if err := handler.DeleteReference(ctx); err != nil {
		t.Fatalf("DeleteReference returned error: %v", err)
	}

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected status 204, got %d", rec.Code)
	}

	if store.deletedBy != "user-1234" {
		t.Fatalf("expected deletedBy user-1234, got %q", store.deletedBy)
	}

	if store.restoreUntil.IsZero() {
		t.Fatal("expected restoreUntil to be set")
	}
}

func TestDeleteReferenceReturnsNotFoundWhenReferenceIsMissing(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/references/ref-1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetPath("/api/v1/references/:id")
	ctx.SetParamNames("id")
	ctx.SetParamValues("ref-1")
	ctx.Set(authsession.ContextUserIDKey, "user-1234")

	handler := &ReferenceHandler{
		DB:          &gorm.DB{},
		createStore: &fakeReferenceCreateStore{},
	}

	if err := handler.DeleteReference(ctx); err != nil {
		t.Fatalf("DeleteReference returned error: %v", err)
	}

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", rec.Code)
	}
}

func TestDeleteReferenceIsIdempotentForAlreadyDeletedReference(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/references/ref-1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetPath("/api/v1/references/:id")
	ctx.SetParamNames("id")
	ctx.SetParamValues("ref-1")
	ctx.Set(authsession.ContextUserIDKey, "user-1234")

	store := &fakeReferenceCreateStore{
		ownedRef: &models.Reference{
			UploaderID: "user-1234",
			DeletedAt:  gorm.DeletedAt{Time: time.Now().UTC(), Valid: true},
		},
	}
	handler := &ReferenceHandler{
		DB:          &gorm.DB{},
		createStore: store,
	}

	if err := handler.DeleteReference(ctx); err != nil {
		t.Fatalf("DeleteReference returned error: %v", err)
	}

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected status 204, got %d", rec.Code)
	}

	if !store.restoreUntil.IsZero() {
		t.Fatal("expected idempotent delete to skip soft delete call")
	}
}

func TestRestoreReferenceRestoresOwnedReferenceWithinWindow(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/references/ref-1/restore", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetPath("/api/v1/references/:id/restore")
	ctx.SetParamNames("id")
	ctx.SetParamValues("ref-1")
	ctx.Set(authsession.ContextUserIDKey, "user-1234")

	restoreUntil := time.Now().UTC().Add(time.Hour)
	deletedBy := "user-1234"
	store := &fakeReferenceCreateStore{
		ownedRef: &models.Reference{
			UploaderID:   "user-1234",
			DeletedAt:    gorm.DeletedAt{Time: time.Now().UTC(), Valid: true},
			DeletedBy:    &deletedBy,
			RestoreUntil: &restoreUntil,
		},
	}
	handler := &ReferenceHandler{
		DB:          &gorm.DB{},
		createStore: store,
	}

	if err := handler.RestoreReference(ctx); err != nil {
		t.Fatalf("RestoreReference returned error: %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	if !store.restoreCalled {
		t.Fatal("expected restore to be called")
	}
}

func TestRestoreReferenceWithoutAuthenticationReturnsUnauthorized(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/references/ref-1/restore", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetPath("/api/v1/references/:id/restore")
	ctx.SetParamNames("id")
	ctx.SetParamValues("ref-1")

	handler := &ReferenceHandler{}

	if err := handler.RestoreReference(ctx); err != nil {
		t.Fatalf("RestoreReference returned error: %v", err)
	}

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rec.Code)
	}
}

func TestRestoreReferenceReturnsConflictWhenReferenceIsNotDeleted(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/references/ref-1/restore", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetPath("/api/v1/references/:id/restore")
	ctx.SetParamNames("id")
	ctx.SetParamValues("ref-1")
	ctx.Set(authsession.ContextUserIDKey, "user-1234")

	store := &fakeReferenceCreateStore{
		ownedRef: &models.Reference{
			UploaderID: "user-1234",
		},
	}
	handler := &ReferenceHandler{
		DB:          &gorm.DB{},
		createStore: store,
	}

	if err := handler.RestoreReference(ctx); err != nil {
		t.Fatalf("RestoreReference returned error: %v", err)
	}

	if rec.Code != http.StatusConflict {
		t.Fatalf("expected status 409, got %d", rec.Code)
	}
}

func TestRestoreReferenceReturnsGoneWhenWindowExpired(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/references/ref-1/restore", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetPath("/api/v1/references/:id/restore")
	ctx.SetParamNames("id")
	ctx.SetParamValues("ref-1")
	ctx.Set(authsession.ContextUserIDKey, "user-1234")

	restoreUntil := time.Now().UTC().Add(-time.Hour)
	store := &fakeReferenceCreateStore{
		ownedRef: &models.Reference{
			UploaderID:   "user-1234",
			DeletedAt:    gorm.DeletedAt{Time: time.Now().UTC(), Valid: true},
			RestoreUntil: &restoreUntil,
		},
	}
	handler := &ReferenceHandler{
		DB:          &gorm.DB{},
		createStore: store,
	}

	if err := handler.RestoreReference(ctx); err != nil {
		t.Fatalf("RestoreReference returned error: %v", err)
	}

	if rec.Code != http.StatusGone {
		t.Fatalf("expected status 410, got %d", rec.Code)
	}
}

func TestRestoreReferenceReturnsNotFoundWhenReferenceIsMissing(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/references/ref-1/restore", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetPath("/api/v1/references/:id/restore")
	ctx.SetParamNames("id")
	ctx.SetParamValues("ref-1")
	ctx.Set(authsession.ContextUserIDKey, "user-1234")

	handler := &ReferenceHandler{
		DB:          &gorm.DB{},
		createStore: &fakeReferenceCreateStore{},
	}

	if err := handler.RestoreReference(ctx); err != nil {
		t.Fatalf("RestoreReference returned error: %v", err)
	}

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", rec.Code)
	}
}
