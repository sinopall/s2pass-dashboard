package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"s2pas-backend/internal/dto"
	"s2pas-backend/internal/middlewares"
	"s2pas-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type ScriptHandler struct {
	svc *services.ScriptService
}

func NewScriptHandler(svc *services.ScriptService) *ScriptHandler {
	return &ScriptHandler{svc: svc}
}

func (h *ScriptHandler) Create(c *gin.Context) {
	var req dto.ScriptUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	authUser, _ := c.Get(middlewares.CtxUserKey)
	user := authUser.(middlewares.AuthUser)

	script, err := h.svc.Create(c.Request.Context(), user.ID, req.Title, req.Slug, req.CategoryID, req.ProductID, req.IsBreaking, req.Content)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, script)
}

func (h *ScriptHandler) List(c *gin.Context) {
	var q dto.ScriptListQuery
	_ = c.ShouldBindQuery(&q)

	items, total, err := h.svc.List(c.Request.Context(), q.Q, q.CategoryID, q.ProductID, q.Page, q.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"total": total,
		"page":  q.Page,
		"limit": q.Limit,
	})
}

// GET BY ID
func (h *ScriptHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}

	script, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Script tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, script)
}

func (h *ScriptHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID URL tidak valid"})
		return
	}

	var req dto.ScriptUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	script, err := h.svc.Update(c.Request.Context(), id, req.Title, req.Slug, req.CategoryID, req.ProductID, req.IsBreaking, req.Content)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, script)
}

func (h *ScriptHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID URL tidak valid"})
		return
	}

	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *ScriptHandler) GetMy(c *gin.Context) {
	// 1. Ambil user dari context Gin (diset oleh middlewares.AuthMiddleware)
	val, exists := c.Get(middlewares.CtxUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	authUser, ok := val.(middlewares.AuthUser)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid auth context"})
		return
	}
	userID := authUser.ID

	// 3. Panggil service (Gunakan c.Request.Context() untuk passing context standar)
	script, err := h.svc.GetMyScript(c.Request.Context(), userID)
	if err != nil {
		// User belum pernah menyimpan script -> ini kondisi normal, bukan error server
		if err.Error() == "no rows in result set" {
			c.JSON(http.StatusOK, gin.H{
				"status": "success",
				"data":   nil,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 4. Jika script belum ada
	if script == nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Anda belum mengatur script."})
		return
	}

	// 5. Response sukses
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   script,
	})
}

func (h *ScriptHandler) UpsertMy(c *gin.Context) {
	// 1. Ambil user dari context Gin (diset oleh middlewares.AuthMiddleware)
	val, exists := c.Get(middlewares.CtxUserKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	authUser, ok := val.(middlewares.AuthUser)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid auth context"})
		return
	}
	userID := authUser.ID

	// 2. Parse JSON dari Frontend (Kita hanya butuh field "content")
	var req struct {
		Content json.RawMessage `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid"})
		return
	}

	// 3. Eksekusi Upsert
	err := h.svc.UpsertMyScript(c.Request.Context(), userID, req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan script: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Script berhasil disimpan!",
	})
}
