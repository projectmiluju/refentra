package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           string `gorm:"primaryKey;type:text" json:"id"`
	Name         string `gorm:"not null" json:"name"`
	Email        string `gorm:"not null;uniqueIndex:users_email_key" json:"email"`
	PasswordHash string `gorm:"not null" json:"-"`
	Timestamps
}

func (u *User) BeforeCreate(*gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.NewString()
	}

	return nil
}
