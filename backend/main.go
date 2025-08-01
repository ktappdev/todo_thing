package main

import (
	"log"
	"net"
	"net/http"
	"strings"

	"household-todo-backend/config"
	"household-todo-backend/controllers"
	"household-todo-backend/middleware"
	"household-todo-backend/models"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	db := config.InitDB()

	// Auto migrate the models
	err := db.AutoMigrate(
		&models.Household{},
		&models.User{},
		&models.Task{},
		&models.TaskAssignment{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Set up Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Initialize controllers
	householdController := controllers.NewHouseholdController(db)
	taskController := controllers.NewTaskController(db)
	userController := controllers.NewUserController(db)

	// API routes
	api := r.Group("/api")
	{
		// Public routes (no authentication required)
		api.POST("/households", householdController.CreateHousehold)
		api.GET("/households/code/:code", householdController.GetHouseholdByCode)
		api.POST("/households/code/:code/join", householdController.JoinHousehold)

		// Protected routes (authentication required)
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// Bootstrap endpoint
			protected.GET("/me", householdController.GetMe)

			// Household routes
			protected.GET("/households/:id/users", householdController.GetHouseholdUsers)
			protected.GET("/households/:id/invite", householdController.GetInviteCode)
			protected.POST("/households/:id/invite/refresh", householdController.RefreshInviteCode)

			// Task routes
			protected.GET("/households/:id/tasks", taskController.GetHouseholdTasks)
			protected.POST("/households/:id/tasks", taskController.CreateTask)
			protected.PUT("/tasks/:id", taskController.UpdateTask)
			protected.DELETE("/tasks/:id", taskController.DeleteTask)
			protected.PATCH("/tasks/:id/toggle", taskController.ToggleTaskCompletion)
			protected.POST("/tasks/:id/assign", taskController.AssignTask)
			protected.DELETE("/tasks/:id/assign/:userId", taskController.UnassignTask)

			// User routes
			protected.PUT("/users/:id", userController.UpdateUser)
			protected.DELETE("/users/:id", userController.LeaveHousehold)
		}
	}

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Start server
	ifaces, _ := net.Interfaces()
	for _, iface := range ifaces {
		addrs, _ := iface.Addrs()
		for _, addr := range addrs {
			var ip string
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP.String()
			case *net.IPAddr:
				ip = v.IP.String()
			}
			if strings.HasPrefix(ip, "127.") || strings.Contains(ip, ":") || ip == "" {
				continue
			}
			log.Printf("Listening on http://%s:8080", ip)
		}
	}
	log.Println("Listening on http://0.0.0.0:8080 (all interfaces)")
	r.Run("0.0.0.0:8080")
}
