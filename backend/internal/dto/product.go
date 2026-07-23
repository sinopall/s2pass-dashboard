package dto

import "encoding/json"

type ProductListQuery struct {
	Q          string `form:"q"`
	CategoryID int64  `form:"categoryId"`
	Page       int    `form:"page"`
	Limit      int    `form:"limit"`
	// Active: filter status produk.
	// - tidak dikirim (nil) -> tampilkan SEMUA (dipakai admin management)
	// - true  -> hanya produk aktif (dipakai agent browsing/search)
	// - false -> hanya produk nonaktif
	Active *bool `form:"active"`
}

type ProductUpsertRequest struct {
	Title      string `json:"title" binding:"required"`
	Slug       string `json:"slug"` // optional
	CategoryID int64  `json:"category_id" binding:"required"`
	IsBreaking bool   `json:"is_breaking"`
	// IsActive pakai pointer supaya bisa bedakan "tidak dikirim" vs "false".
	// Kalau tidak dikirim (nil), service akan default-kan ke true (khususnya saat create).
	IsActive *bool           `json:"is_active"`
	Content  json.RawMessage `json:"content" binding:"required"`
}

type ProductStatusRequest struct {
	IsActive bool `json:"is_active"`
}
