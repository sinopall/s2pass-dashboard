package services

import (
	"context"
	"errors"

	"s2pas-backend/internal/dto"
	"s2pas-backend/internal/repositories"
	"s2pas-backend/internal/utils"
)

type AuthService struct {
	users   *repositories.UserRepo
	secret  string
	expMins int
}

func NewAuthService(users *repositories.UserRepo, secret string, expMins int) *AuthService {
	return &AuthService{users: users, secret: secret, expMins: expMins}
}

func (s *AuthService) Login(ctx context.Context, username, password string) (*dto.LoginResponse, error) {
	u, err := s.users.GetByUsername(ctx, username)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}
	if !utils.CheckPassword(u.PasswordHash, password) {
		return nil, errors.New("invalid credentials")
	}
	token, err := utils.SignJWT(s.secret, s.expMins, u.ID, u.Username, u.Role)
	if err != nil {
		return nil, err
	}
	return &dto.LoginResponse{
		AccessToken: token,
		User:        dto.UserPublic{ID: u.ID, Username: u.Username, Role: u.Role},
	}, nil
}
