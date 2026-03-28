package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	authsession "refentra/internal/auth"
	"refentra/internal/models"
	"refentra/internal/server"

	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

//go:embed all:frontend/dist
var frontendAssets embed.FS

func envOrDefault(key string, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}

func envBoolOrDefault(key string, fallback bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}

	return parsed
}

func envIntOrDefault(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}

	return parsed
}

func envDurationFromSeconds(key string, fallback time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}

	return time.Duration(parsed) * time.Second
}

func main() {
	// 1. Database Connection
	dsn := "host=" + envOrDefault("DB_HOST", "localhost") +
		" user=" + envOrDefault("DB_USER", "postgres") +
		" password=" + envOrDefault("DB_PASSWORD", "postgres") +
		" dbname=" + envOrDefault("DB_NAME", "refentra") +
		" port=" + envOrDefault("DB_PORT", "5433") +
		" sslmode=" + envOrDefault("DB_SSLMODE", "disable") +
		" TimeZone=" + envOrDefault("DB_TIMEZONE", "Asia/Seoul")

	var db *gorm.DB
	var redisClient *redis.Client
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Printf("DB connection failed: %v. Running without DB for now.", err)
	} else {
		sqlDB, sqlErr := db.DB()
		if sqlErr != nil {
			log.Printf("DB handle extraction failed: %v. Running without DB for now.", sqlErr)
			db = nil
		} else if pingErr := sqlDB.Ping(); pingErr != nil {
			log.Printf("DB ping failed: %v. Running without DB for now.", pingErr)
			db = nil
		} else if normalizeErr := normalizeLegacyUserEmailConstraint(db); normalizeErr != nil {
			log.Printf("DB migration preflight failed: %v. Running without DB for now.", normalizeErr)
			db = nil
		} else if migrateErr := db.AutoMigrate(&models.User{}, &models.Reference{}); migrateErr != nil {
			log.Printf("DB migration failed: %v. Running without DB for now.", migrateErr)
			db = nil
		} else {
			log.Println("Database connection successful.")
		}
	}

	redisClient = redis.NewClient(&redis.Options{
		Addr:     envOrDefault("REDIS_HOST", "localhost") + ":" + envOrDefault("REDIS_PORT", "6380"),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       envIntOrDefault("REDIS_DB", 0),
	})
	if err := redisClient.Ping(context.Background()).Err(); err != nil {
		log.Printf("Redis ping failed: %v. Running without Redis for now.", err)
		redisClient = nil
	} else {
		log.Println("Redis connection successful.")
	}

	// 2. Extract embedded frontend files
	distFs, err := fs.Sub(frontendAssets, "frontend/dist")
	if err != nil {
		log.Printf("Warning: failed to extract frontend assets. Check if 'frontend/dist' exists during build: %v", err)
	}

	// 3. Initialize Server
	var authService *authsession.Service
	if redisClient != nil && db != nil {
		authService = authsession.NewService(authsession.NewRedisSessionStore(redisClient), authsession.NewGormUserStore(db), authsession.Config{
			JWTSecret:         envOrDefault("AUTH_JWT_SECRET", "refentra-dev-secret"),
			AccessTTL:         time.Duration(envIntOrDefault("AUTH_ACCESS_TTL_MINUTES", 15)) * time.Minute,
			RefreshTTL:        time.Duration(envIntOrDefault("AUTH_REFRESH_TTL_HOURS", 24)) * time.Hour,
			AccessCookieName:  envOrDefault("AUTH_ACCESS_COOKIE_NAME", "refentra_access_token"),
			RefreshCookieName: envOrDefault("AUTH_REFRESH_COOKIE_NAME", "refentra_refresh_token"),
			CookieSecure:      envBoolOrDefault("AUTH_COOKIE_SECURE", false),
			CookieSameSite:    http.SameSiteLaxMode,
		})
	}

	securityConfig := server.DefaultSecurityConfig()
	if origins := server.ParseCSV(os.Getenv("CORS_ALLOW_ORIGINS")); len(origins) > 0 {
		securityConfig.CORSAllowOrigins = origins
	}
	if methods := server.ParseCSV(os.Getenv("CORS_ALLOW_METHODS")); len(methods) > 0 {
		securityConfig.CORSAllowMethods = methods
	}
	if headers := server.ParseCSV(os.Getenv("CORS_ALLOW_HEADERS")); len(headers) > 0 {
		securityConfig.CORSAllowHeaders = headers
	}
	securityConfig.CORSAllowCredentials = envBoolOrDefault("CORS_ALLOW_CREDENTIALS", true)
	securityConfig.RateLimitRequests = envIntOrDefault("RATE_LIMIT_REQUESTS", securityConfig.RateLimitRequests)
	securityConfig.RateLimitWindow = envDurationFromSeconds("RATE_LIMIT_WINDOW_SECONDS", securityConfig.RateLimitWindow)
	securityConfig.EnableHSTS = envBoolOrDefault("SECURITY_ENABLE_HSTS", false)
	securityConfig.ContentSecurityPolicy = envOrDefault("SECURITY_CONTENT_SECURITY_POLICY", securityConfig.ContentSecurityPolicy)

	srv := server.NewServer(db, redisClient, authService, distFs, securityConfig)

	// 4. Start Server
	if err := srv.Start(":8080"); err != nil {
		log.Fatal("Server start failed: ", err)
	}
}

func normalizeLegacyUserEmailConstraint(db *gorm.DB) error {
	if db == nil || !db.Migrator().HasTable(&models.User{}) {
		return nil
	}

	if err := db.Exec(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key"`).Error; err != nil {
		return err
	}

	if err := db.Exec(`DROP INDEX IF EXISTS "users_email_key"`).Error; err != nil {
		return err
	}

	return nil
}
