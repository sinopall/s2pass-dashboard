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

type ScriptService struct {
    repo *repositories.ScriptRepository
}

func NewScriptService(repo *repositories.ScriptRepository) *ScriptService {
    return &ScriptService{repo: repo}
}

// Helper Regex (Duplikasi lokal untuk service ini)
var reScriptNonSlug = regexp.MustCompile(`[^a-z0-9\s-]+`)
var reScriptSpaces = regexp.MustCompile(`\s+`)
var reScriptDash = regexp.MustCompile(`-+`)

func slugifyScript(s string) string {
    s = strings.ToLower(strings.TrimSpace(s))
    s = reScriptNonSlug.ReplaceAllString(s, "")
    s = reScriptSpaces.ReplaceAllString(s, "-")
    s = reScriptDash.ReplaceAllString(s, "-")
    s = strings.Trim(s, "-")
    return s
}

func (s *ScriptService) Create(ctx context.Context, title, slug string, categoryID int64, isBreaking bool, content any) (models.Script, error) {
    // 1. Validasi Kategori
    ok, err := s.repo.CategoryExists(ctx, categoryID)
    if err != nil {
        return models.Script{}, err
    }
    if !ok {
        return models.Script{}, errors.New("category_id tidak valid (harus category non-root yang sudah ada)")
    }

    // 2. Generate Slug Unik
    base := slug
    if strings.TrimSpace(base) == "" {
        base = title
    }
    finalSlug, err := s.ensureUniqueSlug(ctx, base, 0)
    if err != nil {
        return models.Script{}, err
    }

    // 3. Simpan ke Repo
    return s.repo.Create(ctx, title, finalSlug, categoryID, isBreaking, content)
}

// Logic Slug (Sama persis dengan Product, tapi cek ke ScriptRepo)
func (s *ScriptService) ensureUniqueSlug(ctx context.Context, base string, excludeID int64) (string, error) {
    base = slugifyScript(base)
    if base == "" {
        return "", errors.New("slug kosong (judul juga kosong?)")
    }

    exists, err := s.repo.SlugExists(ctx, base, excludeID)
    if err != nil {
        return "", err
    }
    if !exists {
        return base, nil
    }

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

func (s *ScriptService) GetByID(ctx context.Context, id int64) (models.Script, error) {
    return s.repo.GetByID(ctx, id)
}

func (s *ScriptService) List(ctx context.Context, q string, categoryID int64, page, limit int) ([]models.Script, int, error) {
    return s.repo.List(ctx, q, categoryID, page, limit)
}

func (s *ScriptService) Update(ctx context.Context, id int64, title, slug string, categoryID int64, isBreaking bool, content any) (models.Script, error) {
    // 1. Validasi Kategori
    ok, err := s.repo.CategoryExists(ctx, categoryID)
    if err != nil {
        return models.Script{}, err
    }
    if !ok {
        return models.Script{}, errors.New("category_id tidak valid (harus category non-root yang sudah ada)")
    }

    // 2. Siapkan Slug Base
    base := slug
    if strings.TrimSpace(base) == "" {
        base = title
    }

    finalSlug, err := s.ensureUniqueSlug(ctx, base, id)
    if err != nil {
        return models.Script{}, err
    }

    // 4. Update ke Database
    return s.repo.Update(ctx, id, title, finalSlug, categoryID, isBreaking, content)
}

func (s *ScriptService) Delete(ctx context.Context, id int64) error {
    return s.repo.Delete(ctx, id)
}