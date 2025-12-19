package handlers

import (
	"strconv"

	"s2pas-backend/internal/dto"
	"s2pas-backend/internal/services"
	"s2pas-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type UserHandler struct {
	svc *services.UserService
	v   *validator.Validate
}

func NewUserHandler(svc *services.UserService) *UserHandler {
	return &UserHandler{svc: svc, v: validator.New()}
}

func (h *UserHandler) List(c *gin.Context) {
	users, err := h.svc.List(c.Request.Context())
	if err != nil {
		utils.JSONError(c, 500, "failed to list users")
		return
	}
	c.JSON(200, users)
}

func (h *UserHandler) Create(c *gin.Context) {
	var req dto.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.JSONError(c, 400, "invalid json")
		return
	}
	if err := h.v.Struct(req); err != nil {
		utils.JSONError(c, 400, err.Error())
		return
	}
	if req.Password != req.RetypePassword {
		utils.JSONError(c, 400, "password and retype_password must match")
		return
	}

	u, err := h.svc.CreateAgent(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		utils.JSONError(c, 400, err.Error())
		return
	}
	c.JSON(201, u)
}

func (h *UserHandler) Update(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	var req dto.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.JSONError(c, 400, "invalid json")
		return
	}
	if err := h.v.Struct(req); err != nil {
		utils.JSONError(c, 400, err.Error())
		return
	}
	if req.Password != nil || req.RetypePassword != nil {
		if req.Password == nil || req.RetypePassword == nil || *req.Password != *req.RetypePassword {
			utils.JSONError(c, 400, "password and retype_password must match")
			return
		}
	}

	u, err := h.svc.Update(c.Request.Context(), id, req.Username, req.Password)
	if err != nil {
		utils.JSONError(c, 400, err.Error())
		return
	}
	c.JSON(200, u)
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		utils.JSONError(c, 400, err.Error())
		return
	}
	c.Status(204)
}
