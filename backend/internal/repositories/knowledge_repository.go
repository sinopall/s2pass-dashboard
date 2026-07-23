package repositories

import (
	"context"
	"github.com/jackc/pgx/v5/pgxpool"
	"s2pas-backend/internal/dto"
)

type KnowledgeRepo struct {
	db *pgxpool.Pool
}

func NewKnowledgeRepo(db *pgxpool.Pool) *KnowledgeRepo {
	return &KnowledgeRepo{db: db}
}

func (r *KnowledgeRepo) GetAll(ctx context.Context, req dto.KnowledgeListQuery) ([]dto.KnowledgeItem, int, error) {
	offset := (req.Page - 1) * req.Limit
	searchPattern := "%" + req.Q + "%"

	query := `
		SELECT p.id, p.title, p.slug, 'product' as type, c.name as category_name, p.updated_at
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE ($1 = '' OR p.title ILIKE $1) 
		  AND ($2 = 0 OR p.category_id = $2)

		UNION ALL

		SELECT s.id, s.title, s.slug, 'script' as type, c.name as category_name, s.updated_at
		FROM scripts s
		LEFT JOIN categories c ON s.category_id = c.id
		WHERE ($1 = '' OR s.title ILIKE $1)
		  AND ($2 = 0 OR s.category_id = $2)

		ORDER BY updated_at DESC
		LIMIT $3 OFFSET $4
	`
	rows, err := r.db.Query(ctx, query, searchPattern, req.CategoryID, req.Limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []dto.KnowledgeItem
	for rows.Next() {
		var i dto.KnowledgeItem
		if err := rows.Scan(&i.ID, &i.Title, &i.Slug, &i.Type, &i.CategoryName, &i.UpdatedAt); err != nil {
			return nil, 0, err
		}
		items = append(items, i)
	}

	countQuery := `
		SELECT SUM(cnt) FROM (
			SELECT count(*) as cnt 
            FROM products p 
            WHERE ($1 = '' OR p.title ILIKE $1) 
              AND ($2 = 0 OR p.category_id = $2)
			
            UNION ALL
			
            SELECT count(*) as cnt 
            FROM scripts s 
            WHERE ($1 = '' OR s.title ILIKE $1) 
              AND ($2 = 0 OR s.category_id = $2)
		) as total_count
	`

	var total int
	if err := r.db.QueryRow(ctx, countQuery, searchPattern, req.CategoryID).Scan(&total); err != nil {
		total = 0
	}

	return items, total, nil
}
