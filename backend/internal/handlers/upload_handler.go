package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler { return &UploadHandler{} }

func (h *UploadHandler) Upload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file required"})
		return
	}

	_ = os.MkdirAll("./uploads", 0755)

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{
		".png": true, ".jpg": true, ".jpeg": true, ".webp": true,
		".pdf": true,
	}
	if !allowed[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only png/jpg/webp/pdf allowed"})
		return
	}

	name := time.Now().Format("20060102_150405") + "_" + strings.ReplaceAll(file.Filename, " ", "_")
	dst := filepath.Join("./uploads", name)

	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed save file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":  "/uploads/" + name,
		"name": file.Filename,
		"ext":  ext,
	})
}
