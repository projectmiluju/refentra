package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	authsession "refentra/internal/auth"
	"refentra/internal/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type ReferenceHandler struct {
	DB *gorm.DB
}

type ReferenceListResponse struct {
	Items         []models.Reference `json:"items"`
	Page          int                `json:"page"`
	Limit         int                `json:"limit"`
	TotalCount    int64              `json:"total_count"`
	TotalPages    int                `json:"total_pages"`
	AvailableTags []string           `json:"available_tags"`
}

const (
	defaultReferencePage  = 1
	defaultReferenceLimit = 10
	maxReferenceLimit     = 50
)

func parsePositiveInt(value string, fallback int) (int, error) {
	if strings.TrimSpace(value) == "" {
		return fallback, nil
	}

	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return 0, errors.New("invalid positive integer")
	}

	return parsed, nil
}

func normalizeReferenceTags(rawValues []string) []string {
	if len(rawValues) == 0 {
		return nil
	}

	result := make([]string, 0, len(rawValues))
	seen := make(map[string]struct{})

	for _, rawValue := range rawValues {
		if strings.TrimSpace(rawValue) == "" {
			continue
		}

		for _, segment := range strings.Split(rawValue, ",") {
			trimmed := strings.TrimSpace(segment)
			if trimmed == "" {
				continue
			}

			if _, ok := seen[trimmed]; ok {
				continue
			}

			seen[trimmed] = struct{}{}
			result = append(result, trimmed)
		}
	}

	if len(result) == 0 {
		return nil
	}

	return result
}

func (h *ReferenceHandler) GetReferences(c echo.Context) error {
	page, err := parsePositiveInt(c.QueryParam("page"), defaultReferencePage)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "page must be a positive integer"})
	}

	limit, err := parsePositiveInt(c.QueryParam("limit"), defaultReferenceLimit)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "limit must be a positive integer"})
	}

	if limit > maxReferenceLimit {
		limit = maxReferenceLimit
	}

	search := strings.TrimSpace(c.QueryParam("search"))
	tags := normalizeReferenceTags(c.QueryParams()["tags"])

	if h.DB == nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "Database connection is unavailable"})
	}

	query := h.DB.Model(&models.Reference{})
	if search != "" {
		pattern := "%" + strings.ToLower(search) + "%"
		query = query.Where(
			"LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(url) LIKE ?",
			pattern,
			pattern,
			pattern,
		)
	}

	for _, tag := range tags {
		tagJSON, marshalErr := json.Marshal([]string{tag})
		if marshalErr != nil {
			c.Logger().Errorf("failed to encode tag filter: %v", marshalErr)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to load references"})
		}

		query = query.Where("tags @> ?", string(tagJSON))
	}

	var totalCount int64
	if err := query.Count(&totalCount).Error; err != nil {
		c.Logger().Errorf("failed to count references: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to load references"})
	}

	totalPages := 0
	if totalCount > 0 {
		totalPages = int((totalCount + int64(limit) - 1) / int64(limit))
	}

	offset := (page - 1) * limit
	if totalPages > 0 && page > totalPages {
		page = 1
		offset = 0
	}

	var refs []models.Reference
	if err := query.Order("created_at desc").Limit(limit).Offset(offset).Find(&refs).Error; err != nil {
		c.Logger().Errorf("failed to load references: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to load references"})
	}
	if refs == nil {
		refs = []models.Reference{}
	}

	var availableTags []string
	if err := h.DB.Raw(`
		SELECT DISTINCT jsonb_array_elements_text(tags) AS tag
		FROM "references"
		WHERE deleted_at IS NULL
		ORDER BY tag ASC
	`).Scan(&availableTags).Error; err != nil {
		c.Logger().Errorf("failed to load available tags: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to load references"})
	}

	if availableTags == nil {
		availableTags = []string{}
	}

	return c.JSON(http.StatusOK, ReferenceListResponse{
		Items:         refs,
		Page:          page,
		Limit:         limit,
		TotalCount:    totalCount,
		TotalPages:    totalPages,
		AvailableTags: availableTags,
	})
}

func (h *ReferenceHandler) CreateReference(c echo.Context) error {
	userID, ok := c.Get(authsession.ContextUserIDKey).(string)
	if !ok || userID == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
	}

	var ref models.Reference
	if err := c.Bind(&ref); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	ref.URL = strings.TrimSpace(ref.URL)
	ref.Title = strings.TrimSpace(ref.Title)
	ref.Description = strings.TrimSpace(ref.Description)

	if ref.URL == "" || ref.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "URL and title are required"})
	}

	ref.UploaderID = userID

	if h.DB == nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "Database connection is unavailable"})
	}

	if err := h.DB.Create(&ref).Error; err != nil {
		c.Logger().Errorf("failed to save reference: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to save reference"})
	}

	return c.JSON(http.StatusCreated, ref)
}
