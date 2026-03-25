package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type AuthHandler struct{}

func (h *AuthHandler) GetMe(c echo.Context) error {
	// Mock implementation for MVP
	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":    "user-1234",
		"name":  "김개발",
		"email": "dev@refentra.com",
	})
}
