package services

import (
	"context"
	"errors"

	"s2pas-backend/internal/models"
	"s2pas-backend/internal/repositories"
	"s2pas-backend/internal/utils"
)

type UserService struct{ repo *repositories.UserRepo }

func NewUserService(repo *repositories.UserRepo) *UserService { return &UserService{repo: repo} }

func (s *UserService) List(ctx context.Context, q, role string, page, limit int) ([]models.User, int, error) {
	return s.repo.List(ctx, q, role, page, limit)
}

func (s *UserService) CreateAgent(ctx context.Context, username, password string) (*models.User, error) {
	hash, err := utils.HashPassword(password)
	if err != nil {
		return nil, err
	}
	return s.repo.Create(ctx, username, hash, "agent")
}

func (s *UserService) Update(ctx context.Context, id int64, username *string, password *string) (*models.User, error) {
	var hash *string
	if password != nil {
		h, err := utils.HashPassword(*password)
		if err != nil {
			return nil, err
		}
		hash = &h
	}
	return s.repo.Update(ctx, id, username, hash)
}

func (s *UserService) Delete(ctx context.Context, id int64) error {
	if id == 1 {
		return errors.New("cannot delete seeded admin")
	}
	return s.repo.Delete(ctx, id)
}
