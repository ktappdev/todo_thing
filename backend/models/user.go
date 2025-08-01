package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID          string     `json:"id" gorm:"primarykey"`
	Name        string     `json:"name" gorm:"not null"`
	DeviceID    string     `json:"deviceId" gorm:"unique;not null"`
	HouseholdID string     `json:"householdId" gorm:"not null"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	LastSeen    *time.Time `json:"lastSeen"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`

	// Relationships
	Household       Household        `json:"household" gorm:"foreignKey:HouseholdID"`
	CreatedTasks    []Task           `json:"createdTasks" gorm:"foreignKey:CreatorID"`
	TaskAssignments []TaskAssignment `json:"taskAssignments" gorm:"foreignKey:UserID"`
}

func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return
}
