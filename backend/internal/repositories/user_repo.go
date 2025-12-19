package repositories

import (
	"context"
	"errors"
	"time"

	"s2pas-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepo struct{ db *pgxpool.Pool }

func NewUserRepo(db *pgxpool.Pool) *UserRepo { return &UserRepo{db: db} }

func (r *UserRepo) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, username, password_hash, role, created_at, updated_at
		FROM users
		WHERE lower(username)=lower($1)
	`, username)

	var u models.User
	if err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role, &u.CreatedAt, &u.UpdatedAt); err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) GetByID(ctx context.Context, id int64) (*models.User, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, username, password_hash, role, created_at, updated_at
		FROM users WHERE id=$1
	`, id)

	var u models.User
	if err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role, &u.CreatedAt, &u.UpdatedAt); err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) List(ctx context.Context) ([]models.User, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, username, role, created_at, updated_at
		FROM users
		ORDER BY id DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Username, &u.Role, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

func (r *UserRepo) Create(ctx context.Context, username, passwordHash, role string) (*models.User, error) {
	row := r.db.QueryRow(ctx, `
		INSERT INTO users (username, password_hash, role)
		VALUES ($1,$2,$3)
		RETURNING id, username, role, created_at, updated_at
	`, username, passwordHash, role)

	var u models.User
	if err := row.Scan(&u.ID, &u.Username, &u.Role, &u.CreatedAt, &u.UpdatedAt); err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) Update(ctx context.Context, id int64, username *string, passwordHash *string) (*models.User, error) {
	if username == nil && passwordHash == nil {
		return nil, errors.New("no fields to update")
	}

	// simple dynamic update
	q := "UPDATE users SET updated_at=$1"
	args := []any{time.Now()}
	idx := 2

	if username != nil {
		q += ", username=$" + itoa(idx)
		args = append(args, *username)
		idx++
	}
	if passwordHash != nil {
		q += ", password_hash=$" + itoa(idx)
		args = append(args, *passwordHash)
		idx++
	}
	q += " WHERE id=$" + itoa(idx) + " RETURNING id, username, role, created_at, updated_at"
	args = append(args, id)

	row := r.db.QueryRow(ctx, q, args...)
	var u models.User
	if err := row.Scan(&u.ID, &u.Username, &u.Role, &u.CreatedAt, &u.UpdatedAt); err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) Delete(ctx context.Context, id int64) error {
	ct, err := r.db.Exec(ctx, `DELETE FROM users WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return errors.New("not found")
	}
	return nil
}

// tiny helper
func itoa(i int) string { return string(rune('0' + i)) } // ok for <=9 in this MVP
