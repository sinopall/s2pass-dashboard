package middlewares

import (
	"net/http"

	"s2pas-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		v, ok := c.Get(CtxUserKey)
		if !ok {
			utils.JSONError(c, http.StatusUnauthorized, "unauthorized")
			c.Abort()
			return
		}
		u := v.(AuthUser)
		if u.Role != role {
			utils.JSONError(c, http.StatusForbidden, "forbidden")
			c.Abort()
			return
		}
		c.Next()
	}
}
