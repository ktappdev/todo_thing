package config

import (
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() *gorm.DB {
	var err error
	// Configure SQLite with proper settings to avoid readonly issues
	dsn := "household_todo.db?cache=shared&mode=rwc&_journal_mode=DELETE&_synchronous=NORMAL&_foreign_keys=on"
	DB, err = gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Set connection pool settings
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatal("Failed to get underlying sql.DB:", err)
	}
	sqlDB.SetMaxOpenConns(1) // SQLite works best with single connection

	log.Println("Database connected successfully")
	return DB
}
