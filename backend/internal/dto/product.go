package dto

type ProductUpsertRequest struct {
	Title      string      `json:"title" binding:"required,min=3"`
	CategoryID int64       `json:"category_id" binding:"required"`
	IsBreaking bool        `json:"is_breaking"`
	Content    interface{} `json:"content" binding:"required"` // map[string]any from JSON
}

type ProductListQuery struct {
	Q          string `form:"q"`
	CategoryID int64  `form:"categoryId"`
	Page       int    `form:"page"`
	Limit      int    `form:"limit"`
}
