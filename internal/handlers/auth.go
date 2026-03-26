package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	authsession "refentra/internal/auth"
)

type AuthHandler struct {
	Service *authsession.Service
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) GetMe(c echo.Context) error {
	if h.Service == nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "Authentication service is unavailable"})
	}

	accessCookie, err := c.Cookie(h.Service.AccessCookieName())
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
	}

	user, err := h.Service.Authenticate(accessCookie.Value)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
	}

	return c.JSON(http.StatusOK, user)
}

func (h *AuthHandler) Login(c echo.Context) error {
	if h.Service == nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "Authentication service is unavailable"})
	}

	var request LoginRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	request.Email = strings.TrimSpace(request.Email)
	request.Password = strings.TrimSpace(request.Password)
	if request.Email == "" || request.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Email and password are required"})
	}

	user, tokenPair, err := h.Service.Login(c.Request().Context(), request.Email, request.Password, c.Request().UserAgent())
	if err != nil {
		if errors.Is(err, authsession.ErrInvalidCredentials) {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "이메일 또는 비밀번호가 올바르지 않습니다."})
		}

		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "로그인에 실패했습니다."})
	}

	h.Service.SetAuthCookies(c.Response().Writer, tokenPair)
	return c.JSON(http.StatusOK, user)
}

func (h *AuthHandler) Refresh(c echo.Context) error {
	if h.Service == nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "Authentication service is unavailable"})
	}

	refreshCookie, err := c.Cookie(h.Service.RefreshCookieName())
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "Authentication required",
			"code":  "AUTH_REQUIRED",
		})
	}

	user, tokenPair, err := h.Service.Refresh(c.Request().Context(), refreshCookie.Value, c.Request().UserAgent())
	if err != nil {
		h.Service.ClearAuthCookies(c.Response().Writer)

		if errors.Is(err, authsession.ErrAuthenticationRequired) {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "Authentication required",
				"code":  "AUTH_REQUIRED",
			})
		}
		if errors.Is(err, authsession.ErrSessionExpired) {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "세션이 만료되었습니다.",
				"code":  "SESSION_EXPIRED",
			})
		}

		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "세션 갱신에 실패했습니다."})
	}

	h.Service.SetAuthCookies(c.Response().Writer, tokenPair)
	return c.JSON(http.StatusOK, user)
}

func (h *AuthHandler) Logout(c echo.Context) error {
	if h.Service == nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "Authentication service is unavailable"})
	}

	refreshCookie, err := c.Cookie(h.Service.RefreshCookieName())
	if err == nil {
		if deleteErr := h.Service.Logout(c.Request().Context(), refreshCookie.Value); deleteErr != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "로그아웃에 실패했습니다."})
		}
	}

	h.Service.ClearAuthCookies(c.Response().Writer)
	return c.NoContent(http.StatusNoContent)
}
