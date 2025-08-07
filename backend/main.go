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
	ws "household-todo-backend/websocket"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	db := config.InitDB()
	err := db.AutoMigrate(
		&models.Household{},
		&models.User{},
		&models.Task{},
		&models.TaskAssignment{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	r := gin.Default()

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

	householdController := controllers.NewHouseholdController(db)
	taskController := controllers.NewTaskController(db)
	userController := controllers.NewUserController(db)

	api := r.Group("/api")
	{
		api.POST("/households", householdController.CreateHousehold)
		api.GET("/households/code/:code", householdController.GetHouseholdByCode)
		api.POST("/households/code/:code/join", householdController.JoinHousehold)

		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/me", householdController.GetMe)
			protected.GET("/households/:id/users", householdController.GetHouseholdUsers)
			protected.GET("/households/:id/invite", householdController.GetInviteCode)
			protected.POST("/households/:id/invite/refresh", householdController.RefreshInviteCode)
			protected.GET("/households/:id/tasks", taskController.GetHouseholdTasks)
			protected.POST("/households/:id/tasks", taskController.CreateTask)
			protected.PUT("/tasks/:id", taskController.UpdateTask)
			protected.DELETE("/tasks/:id", taskController.DeleteTask)
			protected.PATCH("/tasks/:id/toggle", taskController.ToggleTaskCompletion)
			protected.POST("/tasks/:id/assign", taskController.AssignTask)
			protected.DELETE("/tasks/:id/assign/:userId", taskController.UnassignTask)
			protected.PUT("/users/:id", userController.UpdateUser)
			protected.DELETE("/users/:id", userController.LeaveHousehold)
		}
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	ws.RegisterRoutes(r)

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
