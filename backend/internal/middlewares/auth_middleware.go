package middlewares

import (
	"net/http"
	"strings"

	"s2pas-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

const CtxUserKey = "auth_user"

type AuthUser struct {
	ID       int64
	Username string
	Role     string
}

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.GetHeader("Authorization")
		if h == "" || !strings.HasPrefix(h, "Bearer ") {
			utils.JSONError(c, http.StatusUnauthorized, "missing token")
			c.Abort()
			return
		}
		token := strings.TrimPrefix(h, "Bearer ")

		claims, err := utils.ParseJWT(jwtSecret, token)
		if err != nil {
			utils.JSONError(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}

		c.Set(CtxUserKey, AuthUser{
			ID: claims.UserID, Username: claims.Username, Role: claims.Role,
		})
		c.Next()
	}
}
