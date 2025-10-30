package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/anicolao/simciv/simulation/pkg/engine"
	"github.com/anicolao/simciv/simulation/pkg/repository"
)

func main() {
	// Get MongoDB URI from environment
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "simciv"
	}

	log.Printf("Starting SimCiv simulation engine")
	log.Printf("MongoDB URI: %s", mongoURI)
	log.Printf("Database: %s", dbName)

	// Create context that can be cancelled
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Connect to database
	repo, err := repository.NewMongoRepository(ctx, mongoURI, dbName)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer repo.Close(ctx)

	log.Println("Connected to MongoDB")

	// Create simulation engine
	gameEngine := engine.NewGameEngine(repo)

	// Start control server for manual ticks in E2E mode
	if os.Getenv("E2E_TEST_MODE") == "true" {
		go engine.StartControlServer(gameEngine, 3001)
	}

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	// Start engine in goroutine
	go func() {
		if err := gameEngine.Run(ctx); err != nil {
			log.Printf("Engine error: %v", err)
		}
	}()

	log.Println("Simulation engine started. Press Ctrl+C to stop.")

	// Wait for shutdown signal
	<-sigChan
	log.Println("Shutting down gracefully...")
	cancel()

	// Give some time for cleanup
	time.Sleep(1 * time.Second)
	log.Println("Shutdown complete")
}
