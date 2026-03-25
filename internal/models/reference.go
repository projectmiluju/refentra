package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StringArray []string

func (a *StringArray) Scan(value interface{}) error {
	b, _ := value.([]byte)
	return json.Unmarshal(b, a)
}

func (a StringArray) Value() (driver.Value, error) {
	return json.Marshal(a)
}

type Reference struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	URL         string         `gorm:"not null" json:"url"`
	Title       string         `gorm:"not null" json:"title"`
	Description string         `json:"description"`
	Tags        StringArray    `gorm:"type:jsonb" json:"tags"`
	UploaderID  string         `gorm:"not null" json:"uploader_id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
