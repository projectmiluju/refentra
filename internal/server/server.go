package server

import (
	"io/fs"
	"net/http"

	authsession "refentra/internal/auth"
	"refentra/internal/handlers"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type Server struct {
	Echo  *echo.Echo
	DB    *gorm.DB
	Redis *redis.Client
}

func NewServer(db *gorm.DB, redisClient *redis.Client, authService *authsession.Service, distFs fs.FS) *Server {
	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	refHandler := &handlers.ReferenceHandler{DB: db}
	authHandler := &handlers.AuthHandler{Service: authService}
	healthHandler := &handlers.HealthHandler{DB: db, Redis: redisClient}

	api := e.Group("/api/v1")
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
