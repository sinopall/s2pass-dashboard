package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	DatabaseURL       string
	JWTSecret         string
	JWTExpiresMinutes int
}

func Load() Config {
	_ = godotenv.Load()

	port := getEnv("APP_PORT", "8080")
	dbURL := mustEnv("DATABASE_URL")
	secret := mustEnv("JWT_SECRET")
	expStr := getEnv("JWT_EXPIRES_MINUTES", "120")
	exp, err := strconv.Atoi(expStr)
	if err != nil {
		log.Fatal("invalid JWT_EXPIRES_MINUTES")
	}

	return Config{
		Port:              port,
		DatabaseURL:       dbURL,
		JWTSecret:         secret,
		JWTExpiresMinutes: exp,
	}
}

func getEnv(k, def string) string {
	v := os.Getenv(k)
	if v == "" {
		return def
	}
	return v
}

func mustEnv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		log.Fatalf("missing env: %s", k)
	}
	return v
}
