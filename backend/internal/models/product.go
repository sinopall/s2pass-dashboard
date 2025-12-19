package models

import (
	"encoding/json"
	"time"
)

type Product struct {
	ID         int64           `json:"id"`
	Title      string          `json:"title"`
	CategoryID int64           `json:"category_id"`
	IsBreaking bool            `json:"is_breaking"`
	Content    json.RawMessage `json:"content"` // IMPORTANT: raw JSON, bukan []byte base64
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}
