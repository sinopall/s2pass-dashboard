package dto

type UpsertCategoryPathRequest struct {
	Path []string `json:"path" validate:"required,min=2,dive,required,min=1,max=80"`
}

type RenameCategoryRequest struct {
	Name string `json:"name" validate:"required,min=1,max=80"`
}
