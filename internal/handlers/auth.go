package handlers

import (
	"errors"
	"net/http"
	"net/mail"
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

type SignupRequest struct {
	Name     string `json:"name"`
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
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "The email or password is incorrect."})
		}

		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to sign in."})
	}

	h.Service.SetAuthCookies(c.Response().Writer, tokenPair)
	return c.JSON(http.StatusOK, user)
}

func (h *AuthHandler) Signup(c echo.Context) error {
	if h.Service == nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "Authentication service is unavailable"})
	}

	var request SignupRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	request.Name = strings.TrimSpace(request.Name)
	request.Email = strings.ToLower(strings.TrimSpace(request.Email))
	request.Password = strings.TrimSpace(request.Password)

	if request.Name == "" || request.Email == "" || request.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Name, email, and password are required"})
	}

	if _, err := mail.ParseAddress(request.Email); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Enter a valid email address."})
	}

	if len(request.Password) < authsession.MinimumPasswordLen {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Password must be at least 8 characters."})
	}

	user, tokenPair, err := h.Service.Signup(
		c.Request().Context(),
		request.Name,
		request.Email,
		request.Password,
		c.Request().UserAgent(),
	)
	if err != nil {
		if errors.Is(err, authsession.ErrDuplicateEmail) {
			return c.JSON(http.StatusConflict, map[string]string{"error": "This email is already registered."})
		}

		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create account."})
	}

	h.Service.SetAuthCookies(c.Response().Writer, tokenPair)
	return c.JSON(http.StatusCreated, user)
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
				"error": "Your session has expired.",
				"code":  "SESSION_EXPIRED",
			})
		}

		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to refresh the session."})
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
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to sign out."})
		}
	}

	h.Service.ClearAuthCookies(c.Response().Writer)
	return c.NoContent(http.StatusNoContent)
}
