package server

import (
	"io/fs"
	"net/http"

	"refentra/internal/handlers"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/gorm"
)

type Server struct {
	Echo *echo.Echo
	DB   *gorm.DB
}

func NewServer(db *gorm.DB, distFs fs.FS) *Server {
	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	refHandler := &handlers.ReferenceHandler{DB: db}
	authHandler := &handlers.AuthHandler{}

	api := e.Group("/api/v1")
	api.GET("/references", refHandler.GetReferences)
	api.POST("/references", refHandler.CreateReference)
	api.GET("/auth/me", authHandler.GetMe)

	// Sub FS for embedded Vite build is injected from main
	if distFs != nil {
		e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
			Root:       ".",
			Index:      "index.html",
			HTML5:      true, // This enables SPA fallback routing!
			Filesystem: http.FS(distFs),
		}))
	}

	return &Server{Echo: e, DB: db}
}

func (s *Server) Start(addr string) error {
	return s.Echo.Start(addr)
}
