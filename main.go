package main

import (
	"embed"
	"io/fs"
	"log"

	"refentra/internal/models"
	"refentra/internal/server"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

//go:embed all:frontend/dist
var frontendAssets embed.FS

func main() {
	// 1. Database Connection
	dsn := "host=localhost user=postgres password=postgres dbname=refentra port=5432 sslmode=disable TimeZone=Asia/Seoul"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Printf("DB connection failed: %v. Running without DB for now.", err)
	} else {
		log.Println("Database connection successful.")
		db.AutoMigrate(&models.Reference{})
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
