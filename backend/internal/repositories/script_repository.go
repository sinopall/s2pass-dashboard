package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"s2pas-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ScriptRepository struct {
	db *pgxpool.Pool
}

func NewScriptRepository(db *pgxpool.Pool) *ScriptRepository {
	return &ScriptRepository{db: db}
}

// Cek validasi kategori (Logic sama: harus ada dan bukan root)
func (r *ScriptRepository) CategoryExists(ctx context.Context, id int64) (bool, error) {
	var ok bool
	err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM categories WHERE id=$1 AND parent_id IS NOT NULL)`, id).Scan(&ok)
	return ok, err
}

// Cek slug di tabel SCRIPTS
func (r *ScriptRepository) SlugExists(ctx context.Context, slug string, excludeID int64) (bool, error) {
	slug = strings.TrimSpace(strings.ToLower(slug))
	if slug == "" {
		return false, nil
	}

	var ok bool
	if excludeID > 0 {
		err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM scripts WHERE slug=$1 AND id<>$2)`, slug, excludeID).Scan(&ok)
		return ok, err
	}
	err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM scripts WHERE slug=$1)`, slug).Scan(&ok)
	return ok, err
}

func (r *ScriptRepository) Create(ctx context.Context, title, slug string, categoryID int64, isBreaking bool, content any) (models.Script, error) {
	b, _ := json.Marshal(content)

	var s models.Script
	err := r.db.QueryRow(ctx, `
        INSERT INTO scripts(title, slug, category_id, is_breaking, content)
        VALUES ($1,$2,$3,$4,$5::jsonb)
        RETURNING id,title,slug,category_id,is_breaking,content,created_at,updated_at
    `, title, slug, categoryID, isBreaking, string(b)).
		Scan(&s.ID, &s.Title, &s.Slug, &s.CategoryID, &s.IsBreaking, &s.Content, &s.CreatedAt, &s.UpdatedAt)
	return s, err
}

func (r *ScriptRepository) GetByID(ctx context.Context, id int64) (models.Script, error) {
	var s models.Script
	err := r.db.QueryRow(ctx, `
        SELECT id, title, slug, category_id, is_breaking, content, created_at, updated_at
        FROM scripts 
        WHERE id=$1
    `, id).Scan(&s.ID, &s.Title, &s.Slug, &s.CategoryID, &s.IsBreaking, &s.Content, &s.CreatedAt, &s.UpdatedAt)
	return s, err
}

func (r *ScriptRepository) List(ctx context.Context, q string, categoryID int64, page, limit int) ([]models.Script, int, error) {
	// 1. Default Pagination
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}
	offset := (page - 1) * limit

	// 2. Dynamic Filtering
	conds := []string{"1=1"}
	args := []any{}
	argn := 1

	// Filter Search (Title)
	if strings.TrimSpace(q) != "" {
		conds = append(conds, fmt.Sprintf("LOWER(title) LIKE $%d", argn))
		args = append(args, "%"+strings.ToLower(strings.TrimSpace(q))+"%")
		argn++
	}
	// Filter Category
	if categoryID > 0 {
		conds = append(conds, fmt.Sprintf("category_id=$%d", argn))
		args = append(args, categoryID)
		argn++
	}

	where := strings.Join(conds, " AND ")

	// 3. Count Total Data (untuk pagination frontend)
	var total int
	countSQL := "SELECT COUNT(*) FROM scripts WHERE " + where
	if err := r.db.QueryRow(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// 4. Get Data
	listSQL := fmt.Sprintf(`
        SELECT id, title, slug, category_id, is_breaking, content, created_at, updated_at
        FROM scripts
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

	out := []models.Script{}
	for rows.Next() {
		var s models.Script
		if err := rows.Scan(&s.ID, &s.Title, &s.Slug, &s.CategoryID, &s.IsBreaking, &s.Content, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, 0, err
		}
		out = append(out, s)
	}
	return out, total, nil
}

func (r *ScriptRepository) Update(ctx context.Context, id int64, title, slug string, categoryID int64, isBreaking bool, content any) (models.Script, error) {
	b, _ := json.Marshal(content)

	var s models.Script
	err := r.db.QueryRow(ctx, `
        UPDATE scripts
        SET title=$1, slug=$2, category_id=$3, is_breaking=$4, content=$5::jsonb, updated_at=NOW()
        WHERE id=$6
        RETURNING id, title, slug, category_id, is_breaking, content, created_at, updated_at
    `, title, slug, categoryID, isBreaking, string(b), id).
		Scan(&s.ID, &s.Title, &s.Slug, &s.CategoryID, &s.IsBreaking, &s.Content, &s.CreatedAt, &s.UpdatedAt)
	return s, err
}

// DELETE SCRIPT
func (r *ScriptRepository) Delete(ctx context.Context, id int64) error {
	commandTag, err := r.db.Exec(ctx, `DELETE FROM scripts WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return nil
	}
	return nil
}

func (r *ScriptRepository) GetByUserID(ctx context.Context, userID int64) (*models.Script, error) {
	// Query ini mengambil script berdasarkan user_id yang kita tambahkan di database tadi
	query := `SELECT id, user_id, title, slug, category_id, is_breaking, content, created_at, updated_at 
              FROM scripts WHERE user_id = $1 LIMIT 1`

	var script models.Script
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&script.ID, &script.UserID, &script.Title, &script.Slug,
		&script.CategoryID, &script.IsBreaking, &script.Content,
		&script.CreatedAt, &script.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil // Return nil jika belum punya script
	}
	return &script, err
}

func (r *ScriptRepository) UpsertMyScript(ctx context.Context, userID int64, content json.RawMessage) error {
	// Catatan: Kita asumsikan category_id = 1 untuk "Script Agent Utama".
	// Pastikan di tabel `categories` database Anda sudah ada data dengan id 1.

	query := `
		INSERT INTO scripts (user_id, title, slug, category_id, is_breaking, content, created_at, updated_at)
		VALUES ($1, 'My Agent Script', 'my-script-' || $1, 1, false, $2, NOW(), NOW())
		ON CONFLICT (user_id, category_id) 
		DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
	`

	_, err := r.db.Exec(ctx, query, userID, content)
	return err
}
