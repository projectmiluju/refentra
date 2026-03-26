package handlers

import (
	"net/http"
	"strings"

	"refentra/internal/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type ReferenceHandler struct {
	DB *gorm.DB
}

func (h *ReferenceHandler) GetReferences(c echo.Context) error {
	var refs []models.Reference
	if h.DB != nil {
		h.DB.Order("created_at desc").Limit(50).Find(&refs)
	}
	if refs == nil {
		refs = []models.Reference{}
	}
	return c.JSON(http.StatusOK, refs)
}

func (h *ReferenceHandler) CreateReference(c echo.Context) error {
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

	// MVP Mock Auth User
	ref.UploaderID = "user-1234"

	if h.DB != nil {
		if err := h.DB.Create(&ref).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to save reference"})
		}
	}
	return c.JSON(http.StatusCreated, ref)
}
