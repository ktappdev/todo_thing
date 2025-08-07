package controllers

import (
	"net/http"
	"time"

	"household-todo-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TaskController struct {
	DB *gorm.DB
}

func NewTaskController(db *gorm.DB) *TaskController {
	return &TaskController{DB: db}
}

type CreateTaskRequest struct {
	Title       string              `json:"title" binding:"required"`
	Description string              `json:"description"`
	Category    models.TaskCategory `json:"category"`
	DueDate     *time.Time          `json:"dueDate"`
	AssignedTo  []string            `json:"assignedTo"`
}

type UpdateTaskRequest struct {
	Title       string              `json:"title"`
	Description string              `json:"description"`
	Category    models.TaskCategory `json:"category"`
	DueDate     *time.Time          `json:"dueDate"`
	AssignedTo  []string            `json:"assignedTo"`
}

type AssignTaskRequest struct {
	UserIDs []string `json:"userIds" binding:"required"`
}

// GetHouseholdTasks retrieves all tasks for a household
func (tc *TaskController) GetHouseholdTasks(c *gin.Context) {
	householdID := c.Param("id")
	userHouseholdID := c.GetString("householdID")

	// Verify user belongs to the requested household
	if householdID != userHouseholdID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var tasks []models.Task
	if err := tc.DB.Where("household_id = ?", householdID).
		Preload("Creator").
		Preload("Assignments.User").
		Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks"})
		return
	}

	c.JSON(http.StatusOK, tasks)
}

// CreateTask creates a new task
func (tc *TaskController) CreateTask(c *gin.Context) {
	householdID := c.Param("id")
	userID := c.GetString("userID")
	userHouseholdID := c.GetString("householdID")

	// Enforce that the JWT household matches the path household
	if householdID != userHouseholdID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var req CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify household exists and user belongs to it
	var household models.Household
	if err := tc.DB.Where("id = ?", householdID).First(&household).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Household not found"})
		return
	}

	// Verify user exists and belongs to the household
	var creator models.User
	if err := tc.DB.Where("id = ? AND household_id = ?", userID, householdID).First(&creator).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "User not authorized for this household"})
		return
	}

	task := models.Task{
		Title:       req.Title,
		Description: req.Description,
		Category:    req.Category,
		DueDate:     req.DueDate,
		CreatorID:   userID,
		HouseholdID: householdID,
	}

	if err := tc.DB.Create(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
		return
	}

	// Create task assignments if any
	if len(req.AssignedTo) > 0 {
		for _, userID := range req.AssignedTo {
			assignment := models.TaskAssignment{
				TaskID: task.ID,
				UserID: userID,
			}
			tc.DB.Create(&assignment)
		}
	}

	// Reload task with relationships
	if err := tc.DB.Preload("Creator").Preload("Assignments.User").Where("id = ?", task.ID).First(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load task"})
		return
	}

	c.JSON(http.StatusCreated, task)
}

// UpdateTask updates an existing task
func (tc *TaskController) UpdateTask(c *gin.Context) {
	taskID := c.Param("id")
	householdID := c.GetString("householdID")

	var req UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var task models.Task
	if err := tc.DB.Where("id = ? AND household_id = ?", taskID, householdID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	// Update fields
	if req.Title != "" {
		task.Title = req.Title
	}
	if req.Description != "" {
		task.Description = req.Description
	}
	if req.Category != "" {
		task.Category = req.Category
	}
	if req.DueDate != nil {
		task.DueDate = req.DueDate
	}

	if err := tc.DB.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	// Update assignments if provided
	if req.AssignedTo != nil {
		// Remove existing assignments
		tc.DB.Where("task_id = ?", task.ID).Delete(&models.TaskAssignment{})

		// Create new assignments
		for _, userID := range req.AssignedTo {
			assignment := models.TaskAssignment{
				TaskID: task.ID,
				UserID: userID,
			}
			tc.DB.Create(&assignment)
		}
	}

	// Reload task with relationships
	if err := tc.DB.Preload("Creator").Preload("Assignments.User").Where("id = ?", task.ID).First(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load task"})
		return
	}

	c.JSON(http.StatusOK, task)
}

// DeleteTask deletes a task
func (tc *TaskController) DeleteTask(c *gin.Context) {
	taskID := c.Param("id")
	householdID := c.GetString("householdID")

	var task models.Task
	if err := tc.DB.Where("id = ? AND household_id = ?", taskID, householdID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	if err := tc.DB.Delete(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}

// ToggleTaskCompletion toggles the completion status of a task
func (tc *TaskController) ToggleTaskCompletion(c *gin.Context) {
	taskID := c.Param("id")
	userID := c.GetString("userID")
	householdID := c.GetString("householdID")

	var task models.Task
	if err := tc.DB.Where("id = ? AND household_id = ?", taskID, householdID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	task.Completed = !task.Completed
	now := time.Now()

	if task.Completed {
		task.CompletedAt = &now
		task.CompletedBy = &userID
	} else {
		task.CompletedAt = nil
		task.CompletedBy = nil
	}

	if err := tc.DB.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	// Reload task with relationships
	if err := tc.DB.Preload("Creator").Preload("Assignments.User").Where("id = ?", task.ID).First(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load task"})
		return
	}

	c.JSON(http.StatusOK, task)
}

// AssignTask assigns a task to users
func (tc *TaskController) AssignTask(c *gin.Context) {
	taskID := c.Param("id")
	householdID := c.GetString("householdID")

	var req AssignTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var task models.Task
	if err := tc.DB.Where("id = ? AND household_id = ?", taskID, householdID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	// Create new assignments
	for _, userID := range req.UserIDs {
		// Check if assignment already exists
		var count int64
		tc.DB.Model(&models.TaskAssignment{}).Where("task_id = ? AND user_id = ?", taskID, userID).Count(&count)

		if count == 0 {
			assignment := models.TaskAssignment{
				TaskID: task.ID,
				UserID: userID,
			}
			tc.DB.Create(&assignment)
		}
	}

	// Reload task with relationships
	if err := tc.DB.Preload("Creator").Preload("Assignments.User").Where("id = ?", task.ID).First(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load task"})
		return
	}

	c.JSON(http.StatusOK, task)
}

// UnassignTask removes a task assignment for a user
func (tc *TaskController) UnassignTask(c *gin.Context) {
	taskID := c.Param("id")
	userID := c.Param("userId")
	householdID := c.GetString("householdID")

	var task models.Task
	if err := tc.DB.Where("id = ? AND household_id = ?", taskID, householdID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	if err := tc.DB.Where("task_id = ? AND user_id = ?", taskID, userID).Delete(&models.TaskAssignment{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unassign task"})
		return
	}

	// Reload task with relationships
	if err := tc.DB.Preload("Creator").Preload("Assignments.User").Where("id = ?", task.ID).First(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load task"})
		return
	}

	c.JSON(http.StatusOK, task)
}
