package utils

import "github.com/gin-gonic/gin"

func JSONError(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{"error": message})
}

func JSONOK(c *gin.Context, data any) {
	c.JSON(200, data)
}
