package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type HealthStatusResponse struct {
	Status     string   `json:"status"`
	Message    string   `json:"message"`
	SetupSteps []string `json:"setup_steps,omitempty"`
}

type HealthHandler struct {
	DB *gorm.DB
}

func (h *HealthHandler) GetStatus(c echo.Context) error {
	if h.DB == nil {
		return c.JSON(http.StatusServiceUnavailable, HealthStatusResponse{
			Status:  "unavailable",
			Message: "데이터베이스가 준비되지 않았습니다.",
			SetupSteps: []string{
				"cp .env.example .env",
				"docker compose up -d postgres",
				"cd frontend && npm run build",
				"go run .",
			},
		})
	}

	sqlDB, err := h.DB.DB()
	if err != nil {
		return c.JSON(http.StatusServiceUnavailable, HealthStatusResponse{
			Status:  "unavailable",
			Message: "데이터베이스 핸들을 준비하지 못했습니다.",
		})
	}

	if err := sqlDB.Ping(); err != nil {
		return c.JSON(http.StatusServiceUnavailable, HealthStatusResponse{
			Status:  "unavailable",
			Message: "데이터베이스 연결을 확인해 주세요.",
		})
	}

	var count int64
	if err := h.DB.Table("references").Count(&count).Error; err != nil {
		return c.JSON(http.StatusServiceUnavailable, HealthStatusResponse{
			Status:  "unavailable",
			Message: "데이터베이스 초기화가 완료되지 않았습니다.",
		})
	}

	return c.JSON(http.StatusOK, HealthStatusResponse{
		Status:  "ready",
		Message: "데이터베이스가 준비되었습니다.",
	})
}
