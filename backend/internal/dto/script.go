package dto

import "encoding/json"

type ScriptListQuery struct {
	Q          string `form:"q"`
	CategoryID int64  `form:"categoryId"`
	ProductID  int64  `form:"productId"`
	Page       int    `form:"page"`
	Limit      int    `form:"limit"`
}

type ScriptUpsertRequest struct {
	Title      string          `json:"title" binding:"required"`
	Slug       string          `json:"slug"`
	CategoryID int64           `json:"category_id" binding:"required"`
	ProductID  *int64          `json:"product_id"`
	IsBreaking bool            `json:"is_breaking"`
	Content    json.RawMessage `json:"content" binding:"required"`
}
