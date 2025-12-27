package handlers

import (
	"net/http"
	"strconv"

	"s2pas-backend/internal/dto"
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

    script, err := h.svc.Create(c.Request.Context(), req.Title, req.Slug, req.CategoryID, req.IsBreaking, req.Content)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, script)
}

func (h *ScriptHandler) List(c *gin.Context) {
    var q dto.ScriptListQuery
    _ = c.ShouldBindQuery(&q)

    items, total, err := h.svc.List(c.Request.Context(), q.Q, q.CategoryID, q.Page, q.Limit)
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

    script, err := h.svc.Update(c.Request.Context(), id, req.Title, req.Slug, req.CategoryID, req.IsBreaking, req.Content)
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