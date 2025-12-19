package handlers

import (
	"net/http"

	"s2pas-backend/internal/dto"
	"s2pas-backend/internal/middlewares"
	"s2pas-backend/internal/services"
	"s2pas-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type AuthHandler struct {
	svc *services.AuthService
	v   *validator.Validate
}

func NewAuthHandler(svc *services.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc, v: validator.New()}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "invalid json")
		return
	}
	if err := h.v.Struct(req); err != nil {
		utils.JSONError(c, http.StatusBadRequest, err.Error())
		return
	}

	resp, err := h.svc.Login(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		utils.JSONError(c, http.StatusUnauthorized, "invalid credentials")
		return
	}
	c.JSON(200, resp)
}

func (h *AuthHandler) Me(c *gin.Context) {
	v, _ := c.Get(middlewares.CtxUserKey)
	u := v.(middlewares.AuthUser)
	c.JSON(200, dto.UserPublic{ID: u.ID, Username: u.Username, Role: u.Role})
}
