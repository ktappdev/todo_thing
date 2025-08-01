package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TaskCategory string

const (
	Chores    TaskCategory = "CHORES"
	Shopping  TaskCategory = "SHOPPING"
	Work      TaskCategory = "WORK"
	General   TaskCategory = "GENERAL"
)

type Task struct {
	ID          string       `json:"id" gorm:"primarykey"`
	Title       string       `json:"title" gorm:"not null"`
	Description string       `json:"description"`
	Category    TaskCategory `json:"category" gorm:"default:GENERAL"`
	DueDate     *time.Time   `json:"dueDate"`
	Completed   bool         `json:"completed" gorm:"default:false"`
	CreatorID   string       `json:"creatorId" gorm:"not null"`
	HouseholdID string       `json:"householdId" gorm:"not null"`
	CreatedAt   time.Time    `json:"createdAt"`
	UpdatedAt   time.Time    `json:"updatedAt"`
	CompletedAt *time.Time   `json:"completedAt"`
	CompletedBy *string      `json:"completedBy"`
	
	// Relationships
	Creator         User              `json:"creator" gorm:"foreignKey:CreatorID"`
	Household       Household         `json:"household" gorm:"foreignKey:HouseholdID"`
	Assignments     []TaskAssignment  `json:"assignments" gorm:"foreignKey:TaskID"`
}

func (t *Task) BeforeCreate(tx *gorm.DB) (err error) {
	if t.ID == "" {
		t.ID = uuid.New().String()
	}
	return
}