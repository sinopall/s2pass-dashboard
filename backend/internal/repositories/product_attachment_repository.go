package repositories

import (
	"context"

	"s2pas-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ProductAttachmentRepository struct {
	db *pgxpool.Pool
}

func NewProductAttachmentRepository(db *pgxpool.Pool) *ProductAttachmentRepository {
	return &ProductAttachmentRepository{db: db}
}

func (r *ProductAttachmentRepository) Create(ctx context.Context, productID int64, fileName, fileURL, fileExt string, fileSize int64, kind string, uploadedBy *int64) (models.ProductAttachment, error) {
	var a models.ProductAttachment
	err := r.db.QueryRow(ctx, `
		INSERT INTO product_attachments (product_id, file_name, file_url, file_ext, file_size, kind, uploaded_by)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING id, product_id, file_name, file_url, file_ext, file_size, kind, uploaded_by, created_at
	`, productID, fileName, fileURL, fileExt, fileSize, kind, uploadedBy).
		Scan(&a.ID, &a.ProductID, &a.FileName, &a.FileURL, &a.FileExt, &a.FileSize, &a.Kind, &a.UploadedBy, &a.CreatedAt)
	return a, err
}

func (r *ProductAttachmentRepository) ListByProduct(ctx context.Context, productID int64) ([]models.ProductAttachment, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, product_id, file_name, file_url, file_ext, file_size, kind, uploaded_by, created_at
		FROM product_attachments
		WHERE product_id=$1
		ORDER BY created_at DESC
	`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.ProductAttachment{}
	for rows.Next() {
		var a models.ProductAttachment
		if err := rows.Scan(&a.ID, &a.ProductID, &a.FileName, &a.FileURL, &a.FileExt, &a.FileSize, &a.Kind, &a.UploadedBy, &a.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (r *ProductAttachmentRepository) Delete(ctx context.Context, id int64) (string, error) {
	var fileURL string
	err := r.db.QueryRow(ctx, `
		DELETE FROM product_attachments WHERE id=$1
		RETURNING file_url
	`, id).Scan(&fileURL)
	return fileURL, err
}

func (r *ProductAttachmentRepository) GetByID(ctx context.Context, id int64) (models.ProductAttachment, error) {
	var a models.ProductAttachment
	err := r.db.QueryRow(ctx, `
		SELECT id, product_id, file_name, file_url, file_ext, file_size, kind, uploaded_by, created_at
		FROM product_attachments WHERE id=$1
	`, id).Scan(&a.ID, &a.ProductID, &a.FileName, &a.FileURL, &a.FileExt, &a.FileSize, &a.Kind, &a.UploadedBy, &a.CreatedAt)
	return a, err
}
