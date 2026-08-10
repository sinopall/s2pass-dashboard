package routes

import (
	"s2pas-backend/internal/config"
	"s2pas-backend/internal/handlers"
	"s2pas-backend/internal/middlewares"
	"s2pas-backend/internal/repositories"
	"s2pas-backend/internal/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Register(r *gin.Engine, db *pgxpool.Pool, cfg config.Config) {
	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization", "Accept"},
		AllowCredentials: true,
	}))
	
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


	uploadH := handlers.NewUploadHandler()
	docxImportH := handlers.NewDocxImportHandler()

	// scripts
	scriptRepo := repositories.NewScriptRepository(db)
	scriptSvc := services.NewScriptService(scriptRepo)
	scriptH := handlers.NewScriptHandler(scriptSvc)

	// knowledge base
	knowledgeRepo := repositories.NewKnowledgeRepo(db)
	knowledgeSvc := services.NewKnowledgeService(knowledgeRepo)
	knowledgeH := handlers.NewKnowledgeHandler(knowledgeSvc)

	api := r.Group("/api")

	// Public
	api.POST("/auth/login", authH.Login)

	// Protected
	protected := api.Group("")
	protected.Use(middlewares.AuthMiddleware(cfg.JWTSecret))
	protected.GET("/auth/me", authH.Me)
	protected.POST("/uploads", uploadH.Upload)
	protected.POST("/docx/import", docxImportH.Import)

	// Admin only
	admin := protected.Group("")
	admin.Use(middlewares.RequireRole("admin"))
	admin.GET("/users", userH.List)
	admin.POST("/users", userH.Create)
	admin.PUT("/users/:id", userH.Update)
	admin.DELETE("/users/:id", userH.Delete)

	// Categories
	protected.GET("/categories/tree", catH.Tree)
	protected.GET("/categories/children", catH.Children)
	admin.POST("/categories/path", catH.UpsertPath)
	admin.PUT("/categories/:id", catH.Rename)
	admin.DELETE("/categories/:id", catH.Delete)
	protected.GET("/categories/path", catH.Path)

	// Products
	api.GET("/products", productHandler.List)
	api.GET("/products/breaking", productHandler.Breaking)
	api.GET("/products/:id", productHandler.Get)
	api.GET("/public/:slug", productHandler.GetBySlugPublic)

	admin.POST("/products", productHandler.Create)
	admin.PUT("/products/:id", productHandler.Update)
	admin.PATCH("/products/:id/status", productHandler.UpdateStatus)
	admin.DELETE("/products/:id", productHandler.Delete)


	// Scripts
	api.GET("/scripts", scriptH.List)
	api.GET("/scripts/:id", scriptH.Get)
	protected.GET("/scripts/my-script", scriptH.GetMy)
	protected.PUT("/scripts/my-script", scriptH.UpsertMy)
	admin.POST("/scripts", scriptH.Create)
	admin.PUT("/scripts/:id", scriptH.Update)
	admin.DELETE("/scripts/:id", scriptH.Delete)

	// Knowledge base (gabungan Products + Scripts, buat search global)
	protected.GET("/knowledge-base/all", knowledgeH.GetAll)
}
