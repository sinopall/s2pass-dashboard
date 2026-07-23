package models

import (
	"encoding/json"
	"time"
)

type Product struct {
	ID         int64           `json:"id"`
	Title      string          `json:"title"`
	Slug       string          `json:"slug"`
	CategoryID int64           `json:"category_id"`
	IsBreaking bool            `json:"is_breaking"`
	IsActive   bool            `json:"is_active"`
	Content    json.RawMessage `json:"content"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}
