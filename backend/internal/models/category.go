package models

import "time"

type Category struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	ParentID  *int64    `json:"parent_id"`
	Level     int       `json:"level"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CategoryNode struct {
	ID       int64          `json:"id"`
	Name     string         `json:"name"`
	ParentID *int64         `json:"parent_id"`
	Level    int            `json:"level"`
	Children []CategoryNode `json:"children"`
}
