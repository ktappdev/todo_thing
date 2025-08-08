package controllers

import (
	"log"
	"net/http"
	"time"

	"household-todo-backend/models"
	ws "household-todo-backend/websocket"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserController struct {
	DB *gorm.DB
}

func NewUserController(db *gorm.DB) *UserController {
	return &UserController{DB: db}
}

type UpdateUserRequest struct {
	Name string `json:"name" binding:"required"`
}

// UpdateUser updates a user's information
func (uc *UserController) UpdateUser(c *gin.Context) {
	userID := c.Param("id")
	authUserID := c.GetString("userID")
	householdID := c.GetString("householdID")

	// Users can only update their own information
	if userID != authUserID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := uc.DB.Where("id = ? AND household_id = ?", userID, householdID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.Name = req.Name
	now := time.Now()
	user.LastSeen = &now

	if err := uc.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, user)
	go ws.BroadcastToHousehold(householdID, "user:updated", gin.H{"user": user, "householdId": householdID})
}

// LeaveHousehold removes a user from their household
func (uc *UserController) LeaveHousehold(c *gin.Context) {
	userID := c.Param("id")
	authUserID := c.GetString("userID")
	householdID := c.GetString("householdID")

	// Users can only remove themselves
	if userID != authUserID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// First, find the user by ID only to check if they exist
	var user models.User
	if err := uc.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		log.Printf("User lookup failed for ID %s: %v", userID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if the user's household_id matches the authenticated user's household_id
	if user.HouseholdID != householdID {
		log.Printf("Household mismatch: user.HouseholdID=%s, expected=%s", user.HouseholdID, householdID)
		c.JSON(http.StatusForbidden, gin.H{"error": "User does not belong to this household"})
		return
	}

	// Check if user is the creator of any tasks
	var taskCount int64
	uc.DB.Model(&models.Task{}).Where("creator_id = ?", userID).Count(&taskCount)

	if taskCount > 0 {
		// Reassign tasks to another household member or mark as unassigned
		var otherUsers []models.User
		uc.DB.Where("household_id = ? AND id != ?", user.HouseholdID, userID).Find(&otherUsers)

		if len(otherUsers) > 0 {
			// Reassign to the first other user
			newCreatorID := otherUsers[0].ID
			uc.DB.Model(&models.Task{}).Where("creator_id = ?", userID).Update("creator_id", newCreatorID)
		} else {
			// No other users, delete the tasks
			uc.DB.Where("creator_id = ?", userID).Delete(&models.Task{})
		}
	}

	// Delete user
	if err := uc.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to leave household"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully left household"})
	go ws.BroadcastToHousehold(householdID, "household:member_left", gin.H{"userId": userID, "household": gin.H{"id": householdID}})
}
