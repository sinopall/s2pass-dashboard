package main

import (
	"log"

	"s2pas-backend/internal/config"
	"s2pas-backend/internal/db"
	"s2pas-backend/internal/middlewares"
	"s2pas-backend/internal/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	pool, err := db.NewPostgres(cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	r := gin.Default()

	r.Use(middlewares.CORSMiddleware())
	routes.Register(r, pool, cfg)

	log.Printf("API running on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
