package models

import "time"

type ProductAttachment struct {
	ID         int64     `json:"id"`
	ProductID  int64     `json:"product_id"`
	FileName   string    `json:"file_name"`
	FileURL    string    `json:"file_url"`
	FileExt    string    `json:"file_ext"`
	FileSize   int64     `json:"file_size"`
	Kind       string    `json:"kind"`
	UploadedBy *int64    `json:"uploaded_by"`
	CreatedAt  time.Time `json:"created_at"`
}
