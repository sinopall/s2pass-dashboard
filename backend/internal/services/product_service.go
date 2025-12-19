package services

import (
	"context"
	"errors"

	"s2pas-backend/internal/models"
	"s2pas-backend/internal/repositories"
)

type ProductService struct {
	repo *repositories.ProductRepository
}

func NewProductService(repo *repositories.ProductRepository) *ProductService {
	return &ProductService{repo: repo}
}

func (s *ProductService) Create(ctx context.Context, title string, categoryID int64, isBreaking bool, content any) (models.Product, error) {
	ok, err := s.repo.CategoryExists(ctx, categoryID)
	if err != nil {
		return models.Product{}, err
	}
	if !ok {
		return models.Product{}, errors.New("category_id tidak valid (harus category non-root yang sudah ada)")
	}
	return s.repo.Create(ctx, title, categoryID, isBreaking, content)
}

func (s *ProductService) Update(ctx context.Context, id int64, title string, categoryID int64, isBreaking bool, content any) (models.Product, error) {
	ok, err := s.repo.CategoryExists(ctx, categoryID)
	if err != nil {
		return models.Product{}, err
	}
	if !ok {
		return models.Product{}, errors.New("category_id tidak valid (harus category non-root yang sudah ada)")
	}
	return s.repo.Update(ctx, id, title, categoryID, isBreaking, content)
}

func (s *ProductService) Delete(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}

func (s *ProductService) GetByID(ctx context.Context, id int64) (models.Product, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *ProductService) List(ctx context.Context, q string, categoryID int64, page, limit int) ([]models.Product, int, error) {
	return s.repo.List(ctx, q, categoryID, page, limit)
}

func (s *ProductService) Breaking(ctx context.Context, limit int) ([]models.Product, error) {
	return s.repo.Breaking(ctx, limit)
}
