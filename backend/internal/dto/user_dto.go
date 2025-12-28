package dto

type CreateUserRequest struct {
	Username       string `json:"username" validate:"required,min=3,max=50"`
	Password       string `json:"password" validate:"required,min=8,max=128"`
	RetypePassword string `json:"retype_password" validate:"required,min=8,max=128"`
}

type UpdateUserRequest struct {
	Username       *string `json:"username" validate:"omitempty,min=3,max=50"`
	Password       *string `json:"password" validate:"omitempty,min=8,max=128"`
	RetypePassword *string `json:"retype_password" validate:"omitempty,min=8,max=128"`
}

type UserListQuery struct {
	Q    string `form:"q"`   
	Role string `form:"role"` 
	Page int    `form:"page"`
	Limit int   `form:"limit"`
}