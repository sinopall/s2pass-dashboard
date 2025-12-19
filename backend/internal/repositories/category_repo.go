package repositories

import (
	"context"
	"errors"

	"s2pas-backend/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CategoryRepo struct{ db *pgxpool.Pool }

func NewCategoryRepo(db *pgxpool.Pool) *CategoryRepo { return &CategoryRepo{db: db} }

func (r *CategoryRepo) ListAll(ctx context.Context) ([]models.Category, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, parent_id, level, created_at, updated_at
		FROM categories
		ORDER BY level ASC, id ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.Category
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.ParentID, &c.Level, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *CategoryRepo) ListChildren(ctx context.Context, parentID int64) ([]models.Category, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, parent_id, level, created_at, updated_at
		FROM categories
		WHERE parent_id=$1
		ORDER BY lower(name) ASC
	`, parentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.Category
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.ParentID, &c.Level, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *CategoryRepo) GetByParentAndName(ctx context.Context, tx pgx.Tx, parentID *int64, name string) (*models.Category, error) {
	var row pgx.Row
	if parentID == nil {
		row = tx.QueryRow(ctx, `
			SELECT id, name, parent_id, level, created_at, updated_at
			FROM categories
			WHERE parent_id IS NULL AND lower(name)=lower($1)
		`, name)
	} else {
		row = tx.QueryRow(ctx, `
			SELECT id, name, parent_id, level, created_at, updated_at
			FROM categories
			WHERE parent_id=$1 AND lower(name)=lower($2)
		`, *parentID, name)
	}

	var c models.Category
	if err := row.Scan(&c.ID, &c.Name, &c.ParentID, &c.Level, &c.CreatedAt, &c.UpdatedAt); err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CategoryRepo) Insert(ctx context.Context, tx pgx.Tx, parentID *int64, name string, level int) (*models.Category, error) {
	var row pgx.Row
	if parentID == nil {
		row = tx.QueryRow(ctx, `
			INSERT INTO categories (name, parent_id, level)
			VALUES ($1, NULL, $2)
			RETURNING id, name, parent_id, level, created_at, updated_at
		`, name, level)
	} else {
		row = tx.QueryRow(ctx, `
			INSERT INTO categories (name, parent_id, level)
			VALUES ($1, $2, $3)
			RETURNING id, name, parent_id, level, created_at, updated_at
		`, name, *parentID, level)
	}

	var c models.Category
	if err := row.Scan(&c.ID, &c.Name, &c.ParentID, &c.Level, &c.CreatedAt, &c.UpdatedAt); err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CategoryRepo) Rename(ctx context.Context, id int64, newName string) (*models.Category, error) {
	row := r.db.QueryRow(ctx, `
		UPDATE categories
		SET name=$1, updated_at=now()
		WHERE id=$2
		RETURNING id, name, parent_id, level, created_at, updated_at
	`, newName, id)

	var c models.Category
	if err := row.Scan(&c.ID, &c.Name, &c.ParentID, &c.Level, &c.CreatedAt, &c.UpdatedAt); err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CategoryRepo) HasChildren(ctx context.Context, id int64) (bool, error) {
	row := r.db.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM categories WHERE parent_id=$1)`, id)
	var exists bool
	return exists, row.Scan(&exists)
}

func (r *CategoryRepo) Delete(ctx context.Context, id int64) error {
	ct, err := r.db.Exec(ctx, `DELETE FROM categories WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return errors.New("not found")
	}
	return nil
}

func (r *CategoryRepo) GetRootByName(ctx context.Context, name string) (*models.Category, error) {
	var c models.Category
	err := r.db.QueryRow(ctx, `
		SELECT id,name,parent_id,level,created_at,updated_at
		FROM categories
		WHERE parent_id IS NULL AND lower(name)=lower($1)
	`, name).Scan(&c.ID, &c.Name, &c.ParentID, &c.Level, &c.CreatedAt, &c.UpdatedAt)

	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

func (r *CategoryRepo) ListRoots(ctx context.Context) ([]models.Category, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, parent_id, level, created_at, updated_at
		FROM categories
		WHERE parent_id IS NULL
		ORDER BY level ASC, name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.Category
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.ParentID, &c.Level, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *CategoryRepo) GetPath(ctx context.Context, leafID int64) ([]models.Category, error) {
	rows, err := r.db.Query(ctx, `
		WITH RECURSIVE p AS (
			SELECT id, name, parent_id, level, created_at, updated_at
			FROM categories
			WHERE id = $1
			UNION ALL
			SELECT c.id, c.name, c.parent_id, c.level, c.created_at, c.updated_at
			FROM categories c
			JOIN p ON p.parent_id = c.id
		)
		SELECT id, name, parent_id, level, created_at, updated_at
		FROM p
		ORDER BY level ASC
	`, leafID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.Category
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.ParentID, &c.Level, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}
