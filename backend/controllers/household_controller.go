package controllers

import (
	"net/http"
	"time"

	"household-todo-backend/models"
	"household-todo-backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HouseholdController struct {
	DB *gorm.DB
}

func NewHouseholdController(db *gorm.DB) *HouseholdController {
	return &HouseholdController{DB: db}
}

type CreateHouseholdRequest struct {
	Name     string `json:"name" binding:"required"`
	UserName string `json:"userName" binding:"required"`
	DeviceID string `json:"deviceId" binding:"required"`
}

type JoinHouseholdRequest struct {
	Name     string `json:"name" binding:"required"`
	DeviceID string `json:"deviceId" binding:"required"`
}

// CreateHousehold creates a new household and first user
func (hc *HouseholdController) CreateHousehold(c *gin.Context) {
	var req CreateHouseholdRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate a unique invite code
	inviteCode := utils.GenerateInviteCode(8)

	// Check if invite code already exists (very unlikely but possible)
	for {
		var count int64
		hc.DB.Model(&models.Household{}).Where("invite_code = ?", inviteCode).Count(&count)
		if count == 0 {
			break
		}
		inviteCode = utils.GenerateInviteCode(8)
	}

	// Start transaction
	tx := hc.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create household
	household := models.Household{
		Name:       req.Name,
		InviteCode: inviteCode,
	}

	if err := tx.Create(&household).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create household"})
		return
	}

	// Create first user
	user := models.User{
		Name:        req.UserName,
		DeviceID:    req.DeviceID,
		HouseholdID: household.ID,
		IsActive:    true,
	}

	now := time.Now()
	user.LastSeen = &now

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(user.ID, household.ID, user.DeviceID)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create household"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token":     token,
		"household": household,
		"user":      user,
	})
}

// GetHouseholdByCode retrieves a household by its invite code
func (hc *HouseholdController) GetHouseholdByCode(c *gin.Context) {
	code := c.Param("code")

	var household models.Household
	if err := hc.DB.Where("invite_code = ?", code).First(&household).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Household not found"})
		return
	}

	c.JSON(http.StatusOK, household)
}

// JoinHousehold adds a user to an existing household
func (hc *HouseholdController) JoinHousehold(c *gin.Context) {
	code := c.Param("code")
	var req JoinHouseholdRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var household models.Household
	if err := hc.DB.Where("invite_code = ?", code).First(&household).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Household not found"})
		return
	}

	// Check if device is already registered in this household
	var existingUser models.User
	if err := hc.DB.Where("device_id = ? AND household_id = ?", req.DeviceID, household.ID).First(&existingUser).Error; err == nil {
		// Device already exists, update user name if different
		if existingUser.Name != req.Name {
			existingUser.Name = req.Name
			hc.DB.Save(&existingUser)
		}

		// Generate JWT token for existing user
		token, err := utils.GenerateJWT(existingUser.ID, household.ID, existingUser.DeviceID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"token": token,
			"user":  existingUser,
		})
		return
	}

	user := models.User{
		Name:        req.Name,
		DeviceID:    req.DeviceID,
		HouseholdID: household.ID,
		IsActive:    true,
	}

	now := time.Now()
	user.LastSeen = &now

	if err := hc.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join household"})
		return
	}

	// Generate JWT token for new user
	token, err := utils.GenerateJWT(user.ID, household.ID, user.DeviceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user":  user,
	})
}

// GetHouseholdUsers retrieves all users in a household
func (hc *HouseholdController) GetHouseholdUsers(c *gin.Context) {
	householdID := c.Param("id")
	userHouseholdID := c.GetString("householdID")

	// Verify user belongs to the requested household
	if householdID != userHouseholdID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var users []models.User
	if err := hc.DB.Where("household_id = ?", householdID).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, users)
}

// GetInviteCode retrieves the invite code for a household
func (hc *HouseholdController) GetInviteCode(c *gin.Context) {
	householdID := c.Param("id")
	userHouseholdID := c.GetString("householdID")

	// Verify user belongs to the requested household
	if householdID != userHouseholdID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var household models.Household
	if err := hc.DB.First(&household, householdID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Household not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"inviteCode": household.InviteCode})
}

// RefreshInviteCode generates a new invite code for a household
func (hc *HouseholdController) RefreshInviteCode(c *gin.Context) {
	householdID := c.Param("id")
	userHouseholdID := c.GetString("householdID")

	// Verify user belongs to the requested household
	if householdID != userHouseholdID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var household models.Household
	if err := hc.DB.First(&household, householdID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Household not found"})
		return
	}

	// Generate a new unique invite code
	inviteCode := utils.GenerateInviteCode(8)

	// Check if invite code already exists (very unlikely but possible)
	for {
		var count int64
		hc.DB.Model(&models.Household{}).Where("invite_code = ?", inviteCode).Count(&count)
		if count == 0 {
			break
		}
		inviteCode = utils.GenerateInviteCode(8)
	}

	household.InviteCode = inviteCode
	if err := hc.DB.Save(&household).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to refresh invite code"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"inviteCode": household.InviteCode})
}

// GetMe returns all data for the authenticated user (bootstrap endpoint)
func (hc *HouseholdController) GetMe(c *gin.Context) {
	userID := c.GetString("userID")
	householdID := c.GetString("householdID")

	// Get user data
	var user models.User
	if err := hc.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get household with all users and tasks
	var household models.Household
	if err := hc.DB.Where("id = ?", householdID).
		Preload("Users").
		Preload("Tasks.Creator").
		Preload("Tasks.Assignments.User").
		First(&household).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Household not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":      user,
		"household": household,
	})
}
