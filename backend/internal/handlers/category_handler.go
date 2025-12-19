package handlers

import (
	"strconv"

	"s2pas-backend/internal/dto"
	"s2pas-backend/internal/services"
	"s2pas-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type CategoryHandler struct {
	svc *services.CategoryService
	v   *validator.Validate
}

func NewCategoryHandler(svc *services.CategoryService) *CategoryHandler {
	return &CategoryHandler{svc: svc, v: validator.New()}
}

func (h *CategoryHandler) Tree(c *gin.Context) {
	tree, err := h.svc.Tree(c.Request.Context())
	if err != nil {
		utils.JSONError(c, 500, "failed to build tree")
		return
	}
	c.JSON(200, tree)
}

func (h *CategoryHandler) Children(c *gin.Context) {
	pidStr := c.Query("parentId")
	if pidStr == "" {
		roots, err := h.svc.Roots(c.Request.Context())
		if err != nil {
			utils.JSONError(c, 500, "failed")
			return
		}
		c.JSON(200, roots)
		return
	}

	pid, err := strconv.ParseInt(pidStr, 10, 64)
	if err != nil {
		utils.JSONError(c, 400, "invalid parentId")
		return
	}

	ch, err := h.svc.Children(c.Request.Context(), pid)
	if err != nil {
		utils.JSONError(c, 500, "failed to get children")
		return
	}
	c.JSON(200, ch)
}

func (h *CategoryHandler) UpsertPath(c *gin.Context) {
	var req dto.UpsertCategoryPathRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.JSONError(c, 400, "invalid json")
		return
	}
	if err := h.v.Struct(req); err != nil {
		utils.JSONError(c, 400, err.Error())
		return
	}

	lastID, err := h.svc.UpsertPath(c.Request.Context(), req.Path)
	if err != nil {
		utils.JSONError(c, 400, err.Error())
		return
	}
	c.JSON(201, gin.H{"last_category_id": lastID})
}

func (h *CategoryHandler) Rename(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var req dto.RenameCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.JSONError(c, 400, "invalid json")
		return
	}
	if err := h.v.Struct(req); err != nil {
		utils.JSONError(c, 400, err.Error())
		return
	}
	updated, err := h.svc.Rename(c.Request.Context(), id, req.Name)
	if err != nil {
		utils.JSONError(c, 400, err.Error())
		return
	}
	c.JSON(200, updated)
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		utils.JSONError(c, 400, err.Error())
		return
	}
	c.Status(204)
}

func (h *CategoryHandler) Path(c *gin.Context) {
	leafStr := c.Query("leafId")
	if leafStr == "" {
		utils.JSONError(c, 400, "leafId required")
		return
	}
	leafID, err := strconv.ParseInt(leafStr, 10, 64)
	if err != nil {
		utils.JSONError(c, 400, "invalid leafId")
		return
	}

	path, err := h.svc.GetPath(c.Request.Context(), leafID)
	if err != nil {
		utils.JSONError(c, 400, err.Error())
		return
	}
	c.JSON(200, path)
}
