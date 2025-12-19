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

func (r *ProductRepository) Create(ctx context.Context, title string, categoryID int64, isBreaking bool, content any) (models.Product, error) {
	b, _ := json.Marshal(content)

	var p models.Product
	err := r.db.QueryRow(ctx, `
		INSERT INTO products(title, category_id, is_breaking, content)
		VALUES ($1,$2,$3,$4::jsonb)
		RETURNING id,title,category_id,is_breaking,content,created_at,updated_at
	`, title, categoryID, isBreaking, string(b)).
		Scan(&p.ID, &p.Title, &p.CategoryID, &p.IsBreaking, &p.Content, &p.CreatedAt, &p.UpdatedAt)
	return p, err
}

func (r *ProductRepository) Update(ctx context.Context, id int64, title string, categoryID int64, isBreaking bool, content any) (models.Product, error) {
	b, _ := json.Marshal(content)

	var p models.Product
	err := r.db.QueryRow(ctx, `
		UPDATE products
		SET title=$1, category_id=$2, is_breaking=$3, content=$4::jsonb, updated_at=NOW()
		WHERE id=$5
		RETURNING id,title,category_id,is_breaking,content,created_at,updated_at
	`, title, categoryID, isBreaking, string(b), id).
		Scan(&p.ID, &p.Title, &p.CategoryID, &p.IsBreaking, &p.Content, &p.CreatedAt, &p.UpdatedAt)
	return p, err
}

func (r *ProductRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.db.Exec(ctx, `DELETE FROM products WHERE id=$1`, id)
	return err
}

func (r *ProductRepository) GetByID(ctx context.Context, id int64) (models.Product, error) {
	var p models.Product
	err := r.db.QueryRow(ctx, `
		SELECT id,title,category_id,is_breaking,content,created_at,updated_at
		FROM products WHERE id=$1
	`, id).Scan(&p.ID, &p.Title, &p.CategoryID, &p.IsBreaking, &p.Content, &p.CreatedAt, &p.UpdatedAt)
	return p, err
}

func (r *ProductRepository) List(ctx context.Context, q string, categoryID int64, page, limit int) ([]models.Product, int, error) {
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

	where := strings.Join(conds, " AND ")

	var total int
	countSQL := "SELECT COUNT(*) FROM products WHERE " + where
	if err := r.db.QueryRow(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	listSQL := fmt.Sprintf(`
		SELECT id,title,category_id,is_breaking,content,created_at,updated_at
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
		if err := rows.Scan(&p.ID, &p.Title, &p.CategoryID, &p.IsBreaking, &p.Content, &p.CreatedAt, &p.UpdatedAt); err != nil {
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

	rows, err := r.db.Query(ctx, `
		SELECT id,title,category_id,is_breaking,content,created_at,updated_at
		FROM products
		WHERE is_breaking=TRUE
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
		if err := rows.Scan(&p.ID, &p.Title, &p.CategoryID, &p.IsBreaking, &p.Content, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, nil
}
