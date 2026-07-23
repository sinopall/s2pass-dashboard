package models

import (
	"encoding/json"
	"time"
)

type Script struct {
	ID         int64           `json:"id"`
	UserID     int64           `json:"user_id"`
	Title      string          `json:"title"`
	Slug       string          `json:"slug"`
	CategoryID int64           `json:"category_id"`
	IsBreaking bool            `json:"is_breaking"`
	Content    json.RawMessage `json:"content"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}
