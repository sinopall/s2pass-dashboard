package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"s2pas-backend/internal/dto"
	"s2pas-backend/internal/services"
)

type KnowledgeHandler struct {
	svc *services.KnowledgeService
}

func NewKnowledgeHandler(svc *services.KnowledgeService) *KnowledgeHandler {
	return &KnowledgeHandler{svc: svc}
}

func (h *KnowledgeHandler) GetAll(c *gin.Context) {
	// 1. Bind Query Params ke Struct
	var req dto.KnowledgeListQuery

	// Bind otomatis membaca ?q=...&categoryId=...&page=...
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query parameters"})
		return
	}

	// 2. Set Default Pagination jika kosong
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 {
		req.Limit = 10
	}
	if req.Limit > 100 {
		req.Limit = 100
	}

	result, err := h.svc.GetAll(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch knowledge base"})
		return
	}

	c.JSON(http.StatusOK, result)
}
