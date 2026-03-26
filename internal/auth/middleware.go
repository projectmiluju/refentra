package auth

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
)

func RequireAuthenticatedUser(service *Service) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if service == nil {
				return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "Authentication service is unavailable"})
			}

			accessCookie, err := c.Cookie(service.AccessCookieName())
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
			}

			user, err := service.Authenticate(accessCookie.Value)
			if err != nil {
				status := http.StatusUnauthorized
				if !errors.Is(err, ErrAuthenticationRequired) {
					status = http.StatusInternalServerError
				}

				return c.JSON(status, map[string]string{"error": "Authentication required"})
			}

			c.Set(ContextUserIDKey, user.ID)
			c.Set(ContextUserEmailKey, user.Email)
			c.Set(ContextUserNameKey, user.Name)

			return next(c)
		}
	}
}
