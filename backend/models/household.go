package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Household struct {
	ID        string    `json:"id" gorm:"primarykey"`
	Name      string    `json:"name" gorm:"not null"`
	InviteCode string   `json:"inviteCode" gorm:"unique;not null"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Users     []User    `json:"users" gorm:"foreignKey:HouseholdID"`
	Tasks     []Task    `json:"tasks" gorm:"foreignKey:HouseholdID"`
}

func (h *Household) BeforeCreate(tx *gorm.DB) (err error) {
	if h.ID == "" {
		h.ID = uuid.New().String()
	}
	return
}