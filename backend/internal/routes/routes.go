package routes

import (
	"s2pas-backend/internal/config"
	"s2pas-backend/internal/handlers"
	"s2pas-backend/internal/middlewares"
	"s2pas-backend/internal/repositories"
	"s2pas-backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Register(r *gin.Engine, db *pgxpool.Pool, cfg config.Config) {
	userRepo := repositories.NewUserRepo(db)
	catRepo := repositories.NewCategoryRepo(db)

	authSvc := services.NewAuthService(userRepo, cfg.JWTSecret, cfg.JWTExpiresMinutes)
	userSvc := services.NewUserService(userRepo)
	catSvc := services.NewCategoryService(db, catRepo)

	authH := handlers.NewAuthHandler(authSvc)
	userH := handlers.NewUserHandler(userSvc)
	catH := handlers.NewCategoryHandler(catSvc)

	productRepo := repositories.NewProductRepository(db)
	productSvc := services.NewProductService(productRepo)
	productHandler := handlers.NewProductHandler(productSvc)

	scriptRepo := repositories.NewScriptRepository(db)
    scriptSvc := services.NewScriptService(scriptRepo)
    scriptHandler := handlers.NewScriptHandler(scriptSvc)

	knowRepo := repositories.NewKnowledgeRepo(db)
	knowSvc := services.NewKnowledgeService(knowRepo)
	knowHandler := handlers.NewKnowledgeHandler(knowSvc)

	uploadH := handlers.NewUploadHandler()

	api := r.Group("/api")

	// Public
	api.POST("/auth/login", authH.Login)

	// Protected
	protected := api.Group("")
	protected.Use(middlewares.AuthMiddleware(cfg.JWTSecret))
	protected.GET("/auth/me", authH.Me)
	protected.POST("/uploads", uploadH.Upload)

	// Admin only
	admin := protected.Group("")
	admin.Use(middlewares.RequireRole("admin"))
	admin.GET("/users", userH.List)
	admin.POST("/users", userH.Create)
	admin.PUT("/users/:id", userH.Update)
	admin.DELETE("/users/:id", userH.Delete)

	// Categories: tree/children bisa dibuka untuk agent juga (read-only)
	protected.GET("/categories/tree", catH.Tree)
	protected.GET("/categories/children", catH.Children)

	// Admin category write
	admin.POST("/categories/path", catH.UpsertPath)
	admin.PUT("/categories/:id", catH.Rename)
	admin.DELETE("/categories/:id", catH.Delete)
	protected.GET("/categories/path", catH.Path)

	// public
	// public product
	api.GET("/products", productHandler.List)
	api.GET("/products/breaking", productHandler.Breaking)
	api.GET("/products/:id", productHandler.Get)
	api.GET("/public/:slug", productHandler.GetBySlugPublic)

	// protected product
	admin.POST("/products", productHandler.Create)
	admin.PUT("/products/:id", productHandler.Update)
	admin.DELETE("/products/:id", productHandler.Delete)

	// public script
	api.GET("/scripts", scriptHandler.List)
    api.GET("/scripts/:id", scriptHandler.Get)
	
	// protected script
	admin.POST("/scripts", scriptHandler.Create)
	admin.PUT("/scripts/:id", scriptHandler.Update) 
    admin.DELETE("/scripts/:id", scriptHandler.Delete)

	// public product and script
	api.GET("/knowledge-base/all", knowHandler.GetAll)
}
