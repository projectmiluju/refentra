package server

import (
	"io/fs"
	"net/http"
	"strconv"
	"time"

	authsession "refentra/internal/auth"
	"refentra/internal/handlers"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/redis/go-redis/v9"
	"golang.org/x/time/rate"
	"gorm.io/gorm"
)

type Server struct {
	Echo  *echo.Echo
	DB    *gorm.DB
	Redis *redis.Client
}

func NewServer(db *gorm.DB, redisClient *redis.Client, authService *authsession.Service, distFs fs.FS, securityConfig SecurityConfig) *Server {
	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     securityConfig.CORSAllowOrigins,
		AllowMethods:     securityConfig.CORSAllowMethods,
		AllowHeaders:     securityConfig.CORSAllowHeaders,
		AllowCredentials: securityConfig.CORSAllowCredentials,
	}))
	e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
		XSSProtection:       "1; mode=block",
		ContentTypeNosniff:  "nosniff",
		XFrameOptions:       "DENY",
		HSTSMaxAge:          hstsMaxAge(securityConfig.EnableHSTS),
		HSTSExcludeSubdomains: false,
		ContentSecurityPolicy: securityConfig.ContentSecurityPolicy,
	}))

	refHandler := &handlers.ReferenceHandler{DB: db}
	authHandler := &handlers.AuthHandler{Service: authService}
	healthHandler := &handlers.HealthHandler{DB: db, Redis: redisClient}

	api := e.Group("/api/v1")
	api.Use(middleware.RateLimiterWithConfig(middleware.RateLimiterConfig{
		Store: middleware.NewRateLimiterMemoryStoreWithConfig(middleware.RateLimiterMemoryStoreConfig{
			Rate:      rate.Limit(float64(securityConfig.RateLimitRequests) / securityConfig.RateLimitWindow.Seconds()),
			Burst:     securityConfig.RateLimitRequests,
			ExpiresIn: securityConfig.RateLimitWindow,
		}),
		IdentifierExtractor: func(c echo.Context) (string, error) {
			return c.RealIP(), nil
		},
		Skipper: func(c echo.Context) bool {
			return c.Path() == "/api/v1/health"
		},
		ErrorHandler: func(c echo.Context, err error) error {
			return echo.NewHTTPError(http.StatusForbidden, "요청 식별자를 확인할 수 없습니다.")
		},
		DenyHandler: func(c echo.Context, _ string, _ error) error {
			retryAfter := int(securityConfig.RateLimitWindow / time.Second)
			c.Response().Header().Set(echo.HeaderRetryAfter, strconv.Itoa(retryAfter))
			return c.JSON(http.StatusTooManyRequests, map[string]string{
				"message": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
			})
		},
	}))
	api.GET("/health", healthHandler.GetStatus)
	api.POST("/auth/login", authHandler.Login)
	api.POST("/auth/refresh", authHandler.Refresh)
	api.POST("/auth/logout", authHandler.Logout)
	api.GET("/auth/me", authHandler.GetMe)

	protected := api.Group("", authsession.RequireAuthenticatedUser(authService))
	protected.GET("/references", refHandler.GetReferences)
	protected.POST("/references", refHandler.CreateReference)

	// Sub FS for embedded Vite build is injected from main
	if distFs != nil {
		e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
			Root:       ".",
			Index:      "index.html",
			HTML5:      true, // This enables SPA fallback routing!
			Filesystem: http.FS(distFs),
		}))
	}

	return &Server{Echo: e, DB: db, Redis: redisClient}
}

func (s *Server) Start(addr string) error {
	return s.Echo.Start(addr)
}
