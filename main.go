package main

import (
	"embed"
	"io/fs"
	"log"
	"os"

	"refentra/internal/models"
	"refentra/internal/server"

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
		} else if migrateErr := db.AutoMigrate(&models.Reference{}); migrateErr != nil {
			log.Printf("DB migration failed: %v. Running without DB for now.", migrateErr)
			db = nil
		} else {
			log.Println("Database connection successful.")
		}
	}

	// 2. Extract embedded frontend files
	distFs, err := fs.Sub(frontendAssets, "frontend/dist")
	if err != nil {
		log.Printf("Warning: failed to extract frontend assets. Check if 'frontend/dist' exists during build: %v", err)
	}

	// 3. Initialize Server
	srv := server.NewServer(db, distFs)

	// 4. Start Server
	if err := srv.Start(":8080"); err != nil {
		log.Fatal("Server start failed: ", err)
	}
}
