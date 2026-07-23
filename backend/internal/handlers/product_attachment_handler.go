package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"s2pas-backend/internal/middlewares"
	"s2pas-backend/internal/repositories"

	"github.com/gin-gonic/gin"
)

type ProductAttachmentHandler struct {
	repo *repositories.ProductAttachmentRepository
}

func NewProductAttachmentHandler(repo *repositories.ProductAttachmentRepository) *ProductAttachmentHandler {
	return &ProductAttachmentHandler{repo: repo}
}

// List GET /api/products/:id/attachments
func (h *ProductAttachmentHandler) List(c *gin.Context) {
	productID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}
	items, err := h.repo.ListByProduct(c.Request.Context(), productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

// Upload POST /api/products/:id/attachments
// Dipakai untuk upload file baru langsung (multipart/form-data)
func (h *ProductAttachmentHandler) Upload(c *gin.Context) {
	productID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file required"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{
		".docx": true, ".pdf": true, ".png": true, ".jpg": true, ".jpeg": true, ".webp": true,
	}
	if !allowed[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tipe file tidak didukung (docx/pdf/png/jpg/webp)"})
		return
	}

	_ = os.MkdirAll("./uploads", 0755)
	storedName := time.Now().Format("20060102_150405") + "_" + strings.ReplaceAll(file.Filename, " ", "_")
	dst := filepath.Join("./uploads", storedName)

	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed save file"})
		return
	}

	uploadedBy := getUploadedByID(c)
	kind := c.DefaultPostForm("kind", "attachment")

	att, err := h.repo.Create(
		c.Request.Context(),
		productID,
		file.Filename,
		"/uploads/"+storedName,
		ext,
		file.Size,
		kind,
		uploadedBy,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, att)
}

// LinkExistingRequest dipakai saat file sudah tersimpan di server
// (contoh: hasil dari /api/docx/import) dan tinggal di-link ke produk,
// tanpa perlu upload ulang file-nya.
type LinkExistingRequest struct {
	FileName string `json:"file_name" binding:"required"`
	FileURL  string `json:"file_url" binding:"required"`
	FileExt  string `json:"file_ext"`
	FileSize int64  `json:"file_size"`
	Kind     string `json:"kind"`
}

// LinkExisting POST /api/products/:id/attachments/link
// Body JSON, dipakai untuk link file yang sudah ada di ./uploads
// (misalnya hasil dari proses import docx) ke sebuah produk.
func (h *ProductAttachmentHandler) LinkExisting(c *gin.Context) {
	productID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}

	var req LinkExistingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file_name dan file_url wajib diisi"})
		return
	}

	// Validasi: file_url harus mengarah ke folder uploads milik server ini
	// (mencegah penyalahgunaan untuk link sembarang path)
	if !strings.HasPrefix(req.FileURL, "/uploads/") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file_url tidak valid"})
		return
	}
	localPath := "." + req.FileURL
	if _, err := os.Stat(localPath); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file tidak ditemukan di server, mungkin sudah dihapus atau import sudah kedaluwarsa"})
		return
	}

	ext := req.FileExt
	if ext == "" {
		ext = strings.ToLower(filepath.Ext(req.FileName))
	}

	kind := req.Kind
	if kind == "" {
		kind = "source_document"
	}

	uploadedBy := getUploadedByID(c)

	att, err := h.repo.Create(
		c.Request.Context(),
		productID,
		req.FileName,
		req.FileURL,
		ext,
		req.FileSize,
		kind,
		uploadedBy,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, att)
}

// Delete DELETE /api/products/attachments/:attachmentId
func (h *ProductAttachmentHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("attachmentId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid attachment id"})
		return
	}

	fileURL, err := h.repo.Delete(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// best-effort: hapus file fisik juga
	if fileURL != "" {
		localPath := "." + fileURL // "/uploads/x.docx" -> "./uploads/x.docx"
		_ = os.Remove(localPath)
	}

	c.Status(http.StatusNoContent)
}

func getUploadedByID(c *gin.Context) *int64 {
	if v, ok := c.Get(middlewares.CtxUserKey); ok {
		u := v.(middlewares.AuthUser)
		return &u.ID
	}
	return nil
}
