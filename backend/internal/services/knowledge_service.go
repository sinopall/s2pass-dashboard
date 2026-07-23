package services

import (
	"context"
	"s2pas-backend/internal/dto"
	"s2pas-backend/internal/repositories"
)

type KnowledgeService struct {
	repo *repositories.KnowledgeRepo
}

func NewKnowledgeService(repo *repositories.KnowledgeRepo) *KnowledgeService {
	return &KnowledgeService{repo: repo}
}

func (s *KnowledgeService) GetAll(ctx context.Context, req dto.KnowledgeListQuery) (*dto.KnowledgeListResponse, error) {

	items, total, err := s.repo.GetAll(ctx, req)
	if err != nil {
		return nil, err
	}

	return &dto.KnowledgeListResponse{
		Items: items,
		Total: total,
		Page:  req.Page,
		Limit: req.Limit,
	}, nil
}
