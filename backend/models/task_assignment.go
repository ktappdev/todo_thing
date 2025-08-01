package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TaskAssignment struct {
	ID     string    `json:"id" gorm:"primarykey"`
	TaskID string    `json:"taskId" gorm:"not null"`
	UserID string    `json:"userId" gorm:"not null"`
	CreatedAt time.Time `json:"createdAt"`
	
	// Relationships
	Task Task `json:"task" gorm:"foreignKey:TaskID"`
	User User `json:"user" gorm:"foreignKey:UserID"`
}

func (ta *TaskAssignment) BeforeCreate(tx *gorm.DB) (err error) {
	if ta.ID == "" {
		ta.ID = uuid.New().String()
	}
	return
}