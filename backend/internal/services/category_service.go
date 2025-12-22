package services

import (
	"context"
	"errors"
	"strings"

	"s2pas-backend/internal/models"
	"s2pas-backend/internal/repositories"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CategoryService struct {
	db   *pgxpool.Pool
	repo *repositories.CategoryRepo
}

func NewCategoryService(db *pgxpool.Pool, repo *repositories.CategoryRepo) *CategoryService {
	return &CategoryService{db: db, repo: repo}
}

func (s *CategoryService) Tree(ctx context.Context) ([]*models.CategoryNode, error) {
	all, err := s.repo.ListAll(ctx)
	if err != nil {
		return nil, err
	}

	// build map id->node
	nodes := make(map[int64]*models.CategoryNode, len(all))

	for _, c := range all {
		n := &models.CategoryNode{
			ID: c.ID, Name: c.Name, ParentID: c.ParentID, Level: c.Level,
			Children: []*models.CategoryNode{},
		}
		nodes[c.ID] = n
	}

	var roots []*models.CategoryNode

	for _, c := range all {
		n := nodes[c.ID]
		if c.ParentID == nil {
			roots = append(roots, n)
		} else {
			parent := nodes[*c.ParentID]
			if parent != nil {
				parent.Children = append(parent.Children, n)
			}
		}
	}

	return roots, nil
}

func (s *CategoryService) Children(ctx context.Context, parentID int64) ([]models.Category, error) {
	return s.repo.ListChildren(ctx, parentID)
}

// Upsert per level: cari (parent_id, lower(name)), kalau ada pakai, kalau tidak insert.
func (s *CategoryService) UpsertPath(ctx context.Context, path []string) (int64, error) {
	if len(path) < 2 {
		return 0, errors.New("path must have at least 2 levels (root + subcategory1)")
	}

	for i := range path {
		path[i] = strings.TrimSpace(path[i])
		if path[i] == "" {
			return 0, errors.New("path contains empty name")
		}
	}

	// root must be one of 3 and must exist (seed)
	rootName := path[0]
	root, err := s.repo.GetRootByName(ctx, rootName)
	if err != nil {
		return 0, err
	}
	if root == nil {
		return 0, errors.New("root category must be one of: Informasi, Request, Complaint")
	}

	tx, err := s.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	// start from root id (do NOT insert root)
	lastID := root.ID
	parentID := &lastID

	// insert from subcategory1 .. n
	for i := 1; i < len(path); i++ {
		name := path[i]
		level := i + 1 // root=1, sub1=2, ...

		existing, e := s.repo.GetByParentAndName(ctx, tx, parentID, name)
		if e == nil && existing != nil {
			lastID = existing.ID
			parentID = &lastID
			continue
		}

		created, err := s.repo.Insert(ctx, tx, parentID, name, level)
		if err != nil {
			return 0, err
		}
		lastID = created.ID
		parentID = &lastID
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return lastID, nil
}

func (s *CategoryService) Rename(ctx context.Context, id int64, name string) (*models.Category, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, errors.New("name cannot be empty")
	}
	return s.repo.Rename(ctx, id, name)
}

// Delete policy: RESTRICT (kalau punya child -> tolak). Aman untuk knowledge tree.
func (s *CategoryService) Delete(ctx context.Context, id int64) error {
	has, err := s.repo.HasChildren(ctx, id)
	if err != nil {
		return err
	}
	if has {
		return errors.New("cannot delete category that has children (restrict)")
	}
	return s.repo.Delete(ctx, id)
}

func (s *CategoryService) Roots(ctx context.Context) ([]models.Category, error) {
	return s.repo.ListRoots(ctx)
}

func (s *CategoryService) GetPath(ctx context.Context, leafID int64) ([]models.Category, error) {
	return s.repo.GetPath(ctx, leafID)
}
