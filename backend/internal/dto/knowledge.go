package dto

import "time"

type KnowledgeListQuery struct {
	Q          string `form:"q"`          
	CategoryID int64  `form:"categoryId"` 
	Page       int    `form:"page"`
	Limit      int    `form:"limit"`
}

type KnowledgeItem struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	Slug      string    `json:"slug"`
	Type      string    `json:"type"` // "product" atau "script"
	CategoryName string    `json:"category_name"`
	UpdatedAt time.Time `json:"updated_at"`
}

type KnowledgeListResponse struct {
	Items []KnowledgeItem `json:"items"`
	Total int             `json:"total"`
	Page  int             `json:"page"`
	Limit int             `json:"limit"`
}