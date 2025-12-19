package dto

import "encoding/json"

type ProductListQuery struct {
	Q          string `form:"q"`
	CategoryID int64  `form:"categoryId"`
	Page       int    `form:"page"`
	Limit      int    `form:"limit"`
}

type ProductUpsertRequest struct {
	Title      string          `json:"title" binding:"required"`
	Slug       string          `json:"slug"` // optional
	CategoryID int64           `json:"category_id" binding:"required"`
	IsBreaking bool            `json:"is_breaking"`
	Content    json.RawMessage `json:"content" binding:"required"`
}
