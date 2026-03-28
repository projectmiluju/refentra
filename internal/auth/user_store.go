package auth

import (
	"context"
	"errors"
	"strings"

	"refentra/internal/models"

	"gorm.io/gorm"
)

var (
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrUserNotFound      = errors.New("user not found")
)

type GormUserStore struct {
	db *gorm.DB
}

func NewGormUserStore(db *gorm.DB) *GormUserStore {
	return &GormUserStore{db: db}
}

func (s *GormUserStore) CreateUser(ctx context.Context, input CreateUserInput) (User, error) {
	user := models.User{
		Name:         strings.TrimSpace(input.Name),
		Email:        strings.ToLower(strings.TrimSpace(input.Email)),
		PasswordHash: input.PasswordHash,
	}

	if err := s.db.WithContext(ctx).Create(&user).Error; err != nil {
		if isUniqueConstraintError(err) {
			return User{}, ErrUserAlreadyExists
		}

		return User{}, err
	}

	return User{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	}, nil
}

func (s *GormUserStore) FindUserByEmail(ctx context.Context, email string) (StoredUser, error) {
	var user models.User
	err := s.db.WithContext(ctx).
		Where("LOWER(email) = ?", strings.ToLower(strings.TrimSpace(email))).
		First(&user).
		Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return StoredUser{}, ErrUserNotFound
		}

		return StoredUser{}, err
	}

	return StoredUser{
		User: User{
			ID:    user.ID,
			Name:  user.Name,
			Email: user.Email,
		},
		PasswordHash: user.PasswordHash,
	}, nil
}

type MemoryUserStore struct {
	usersByEmail map[string]StoredUser
}

func NewMemoryUserStore(seedUsers ...StoredUser) *MemoryUserStore {
	store := &MemoryUserStore{
		usersByEmail: make(map[string]StoredUser, len(seedUsers)),
	}

	for _, user := range seedUsers {
		store.usersByEmail[strings.ToLower(strings.TrimSpace(user.Email))] = user
	}

	return store
}

func (s *MemoryUserStore) CreateUser(_ context.Context, input CreateUserInput) (User, error) {
	email := strings.ToLower(strings.TrimSpace(input.Email))
	if _, exists := s.usersByEmail[email]; exists {
		return User{}, ErrUserAlreadyExists
	}

	user := User{
		ID:    "test-user-" + strings.ReplaceAll(email, "@", "-"),
		Name:  strings.TrimSpace(input.Name),
		Email: email,
	}

	s.usersByEmail[email] = StoredUser{
		User:         user,
		PasswordHash: input.PasswordHash,
	}

	return user, nil
}

func (s *MemoryUserStore) FindUserByEmail(_ context.Context, email string) (StoredUser, error) {
	user, exists := s.usersByEmail[strings.ToLower(strings.TrimSpace(email))]
	if !exists {
		return StoredUser{}, ErrUserNotFound
	}

	return user, nil
}

func isUniqueConstraintError(err error) bool {
	return strings.Contains(strings.ToLower(err.Error()), "duplicate key") ||
		strings.Contains(strings.ToLower(err.Error()), "unique constraint")
}
