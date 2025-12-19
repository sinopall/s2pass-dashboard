package services

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"s2pas-backend/internal/models"
	"s2pas-backend/internal/repositories"
)

type ProductService struct {
	repo *repositories.ProductRepository
}

func NewProductService(repo *repositories.ProductRepository) *ProductService {
	return &ProductService{repo: repo}
}

var reNonSlug = regexp.MustCompile(`[^a-z0-9\s-]+`)
var reSpaces = regexp.MustCompile(`\s+`)
var reDash = regexp.MustCompile(`-+`)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = reNonSlug.ReplaceAllString(s, "")
	s = reSpaces.ReplaceAllString(s, "-")
	s = reDash.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	return s
}

func (s *ProductService) ensureUniqueSlug(ctx context.Context, base string, excludeID int64) (string, error) {
	base = slugify(base)
	if base == "" {
		return "", errors.New("slug kosong (judul juga kosong?)")
	}

	// kalau belum ada -> ok
	exists, err := s.repo.SlugExists(ctx, base, excludeID)
	if err != nil {
		return "", err
	}
	if !exists {
		return base, nil
	}

	// suffix -2, -3, ...
	for i := 2; i <= 200; i++ {
		try := fmt.Sprintf("%s-%d", base, i)
		ok, err := s.repo.SlugExists(ctx, try, excludeID)
		if err != nil {
			return "", err
		}
		if !ok {
			return try, nil
		}
	}
	return "", errors.New("gagal generate slug unik")
}

func (s *ProductService) Create(ctx context.Context, title, slug string, categoryID int64, isBreaking bool, content any) (models.Product, error) {
	ok, err := s.repo.CategoryExists(ctx, categoryID)
	if err != nil {
		return models.Product{}, err
	}
	if !ok {
		return models.Product{}, errors.New("category_id tidak valid (harus category non-root yang sudah ada)")
	}

	base := slug
	if strings.TrimSpace(base) == "" {
		base = title
	}
	finalSlug, err := s.ensureUniqueSlug(ctx, base, 0)
	if err != nil {
		return models.Product{}, err
	}

	return s.repo.Create(ctx, title, finalSlug, categoryID, isBreaking, content)
}

func (s *ProductService) Update(ctx context.Context, id int64, title, slug string, categoryID int64, isBreaking bool, content any) (models.Product, error) {
	ok, err := s.repo.CategoryExists(ctx, categoryID)
	if err != nil {
		return models.Product{}, err
	}
	if !ok {
		return models.Product{}, errors.New("category_id tidak valid (harus category non-root yang sudah ada)")
	}

	base := slug
	if strings.TrimSpace(base) == "" {
		base = title
	}
	finalSlug, err := s.ensureUniqueSlug(ctx, base, id)
	if err != nil {
		return models.Product{}, err
	}

	return s.repo.Update(ctx, id, title, finalSlug, categoryID, isBreaking, content)
}

func (s *ProductService) Delete(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}

func (s *ProductService) GetByID(ctx context.Context, id int64) (models.Product, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *ProductService) GetBySlug(ctx context.Context, slug string) (models.Product, error) {
	return s.repo.GetBySlug(ctx, slug)
}

func (s *ProductService) List(ctx context.Context, q string, categoryID int64, page, limit int) ([]models.Product, int, error) {
	return s.repo.List(ctx, q, categoryID, page, limit)
}

func (s *ProductService) Breaking(ctx context.Context, limit int) ([]models.Product, error) {
	return s.repo.Breaking(ctx, limit)
}
