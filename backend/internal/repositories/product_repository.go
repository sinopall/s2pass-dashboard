package repositories

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"s2pas-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ProductRepository struct {
	db *pgxpool.Pool
}

func NewProductRepository(db *pgxpool.Pool) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) CategoryExists(ctx context.Context, id int64) (bool, error) {
	var ok bool
	err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM categories WHERE id=$1 AND parent_id IS NOT NULL)`, id).Scan(&ok)
	return ok, err
}

func (r *ProductRepository) SlugExists(ctx context.Context, slug string, excludeID int64) (bool, error) {
	slug = strings.TrimSpace(strings.ToLower(slug))
	if slug == "" {
		return false, nil
	}

	var ok bool
	if excludeID > 0 {
		err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM products WHERE slug=$1 AND id<>$2)`, slug, excludeID).Scan(&ok)
		return ok, err
	}
	err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM products WHERE slug=$1)`, slug).Scan(&ok)
	return ok, err
}

func (r *ProductRepository) Create(ctx context.Context, title, slug string, categoryID int64, isBreaking bool, isActive bool, content any) (models.Product, error) {
	b, _ := json.Marshal(content)

	var p models.Product
	err := r.db.QueryRow(ctx, `
		INSERT INTO products(title, slug, category_id, is_breaking, is_active, content)
		VALUES ($1,$2,$3,$4,$5,$6::jsonb)
		RETURNING id,title,slug,category_id,is_breaking,is_active,content,created_at,updated_at
	`, title, slug, categoryID, isBreaking, isActive, string(b)).
		Scan(&p.ID, &p.Title, &p.Slug, &p.CategoryID, &p.IsBreaking, &p.IsActive, &p.Content, &p.CreatedAt, &p.UpdatedAt)
	return p, err
}

func (r *ProductRepository) Update(ctx context.Context, id int64, title, slug string, categoryID int64, isBreaking bool, isActive bool, content any) (models.Product, error) {
	b, _ := json.Marshal(content)

	var p models.Product
	err := r.db.QueryRow(ctx, `
		UPDATE products
		SET title=$1, slug=$2, category_id=$3, is_breaking=$4, is_active=$5, content=$6::jsonb, updated_at=NOW()
		WHERE id=$7
		RETURNING id,title,slug,category_id,is_breaking,is_active,content,created_at,updated_at
	`, title, slug, categoryID, isBreaking, isActive, string(b), id).
		Scan(&p.ID, &p.Title, &p.Slug, &p.CategoryID, &p.IsBreaking, &p.IsActive, &p.Content, &p.CreatedAt, &p.UpdatedAt)
	return p, err
}

// UpdateStatus - partial update, dipakai untuk toggle cepat aktif/nonaktif
// dari halaman list, tanpa perlu submit ulang seluruh form.
func (r *ProductRepository) UpdateStatus(ctx context.Context, id int64, isActive bool) (models.Product, error) {
	var p models.Product
	err := r.db.QueryRow(ctx, `
		UPDATE products
		SET is_active=$1, updated_at=NOW()
		WHERE id=$2
		RETURNING id,title,slug,category_id,is_breaking,is_active,content,created_at,updated_at
	`, isActive, id).
		Scan(&p.ID, &p.Title, &p.Slug, &p.CategoryID, &p.IsBreaking, &p.IsActive, &p.Content, &p.CreatedAt, &p.UpdatedAt)
	return p, err
}

func (r *ProductRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.db.Exec(ctx, `DELETE FROM products WHERE id=$1`, id)
	return err
}

func (r *ProductRepository) GetByID(ctx context.Context, id int64) (models.Product, error) {
	var p models.Product
	err := r.db.QueryRow(ctx, `
		SELECT id,title,slug,category_id,is_breaking,is_active,content,created_at,updated_at
		FROM products WHERE id=$1
	`, id).Scan(&p.ID, &p.Title, &p.Slug, &p.CategoryID, &p.IsBreaking, &p.IsActive, &p.Content, &p.CreatedAt, &p.UpdatedAt)
	return p, err
}

func (r *ProductRepository) GetBySlug(ctx context.Context, slug string) (models.Product, error) {
	var p models.Product
	err := r.db.QueryRow(ctx, `
		SELECT id,title,slug,category_id,is_breaking,is_active,content,created_at,updated_at
		FROM products WHERE slug=$1
	`, strings.ToLower(strings.TrimSpace(slug))).
		Scan(&p.ID, &p.Title, &p.Slug, &p.CategoryID, &p.IsBreaking, &p.IsActive, &p.Content, &p.CreatedAt, &p.UpdatedAt)
	return p, err
}

func (r *ProductRepository) List(ctx context.Context, q string, categoryID int64, page, limit int, active *bool) ([]models.Product, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}
	offset := (page - 1) * limit

	conds := []string{"1=1"}
	args := []any{}
	argn := 1

	if strings.TrimSpace(q) != "" {
		conds = append(conds, fmt.Sprintf("LOWER(title) LIKE $%d", argn))
		args = append(args, "%"+strings.ToLower(strings.TrimSpace(q))+"%")
		argn++
	}
	if categoryID > 0 {
		conds = append(conds, fmt.Sprintf("category_id=$%d", argn))
		args = append(args, categoryID)
		argn++
	}
	if active != nil {
		conds = append(conds, fmt.Sprintf("is_active=$%d", argn))
		args = append(args, *active)
		argn++
	}

	where := strings.Join(conds, " AND ")

	var total int
	countSQL := "SELECT COUNT(*) FROM products WHERE " + where
	if err := r.db.QueryRow(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	listSQL := fmt.Sprintf(`
		SELECT id,title,slug,category_id,is_breaking,is_active,content,created_at,updated_at
		FROM products
		WHERE %s
		ORDER BY updated_at DESC
		LIMIT $%d OFFSET $%d
	`, where, argn, argn+1)

	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, listSQL, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	out := []models.Product{}
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(&p.ID, &p.Title, &p.Slug, &p.CategoryID, &p.IsBreaking, &p.IsActive, &p.Content, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, 0, err
		}
		out = append(out, p)
	}
	return out, total, nil
}

func (r *ProductRepository) Breaking(ctx context.Context, limit int) ([]models.Product, error) {
	if limit <= 0 || limit > 20 {
		limit = 10
	}

	// Breaking ticker cuma boleh nampilin produk yang masih aktif.
	rows, err := r.db.Query(ctx, `
		SELECT id,title,slug,category_id,is_breaking,is_active,content,created_at,updated_at
		FROM products
		WHERE is_breaking=TRUE AND is_active=TRUE
		ORDER BY updated_at DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.Product{}
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(&p.ID, &p.Title, &p.Slug, &p.CategoryID, &p.IsBreaking, &p.IsActive, &p.Content, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, nil
}
