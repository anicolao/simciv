package engine

import (
	"context"
	"log"
	"time"

	"github.com/anicolao/simciv/simulation/pkg/models"
	"github.com/anicolao/simciv/simulation/pkg/repository"
)

// GameEngine processes game ticks for all active games
type GameEngine struct {
	repo repository.GameRepository
}

// NewGameEngine creates a new game engine
func NewGameEngine(repo repository.GameRepository) *GameEngine {
	return &GameEngine{
		repo: repo,
	}
}

// Run starts the game engine loop
func (e *GameEngine) Run(ctx context.Context) error {
	ticker := time.NewTicker(100 * time.Millisecond) // Check every 100ms
	defer ticker.Stop()

	log.Println("Game engine running...")

	for {
		select {
		case <-ctx.Done():
			log.Println("Game engine stopping...")
			return ctx.Err()
		case <-ticker.C:
			if err := e.processTick(ctx); err != nil {
				log.Printf("Error processing tick: %v", err)
			}
		}
	}
}

// processTick processes all games that need ticking
func (e *GameEngine) processTick(ctx context.Context) error {
	games, err := e.repo.GetStartedGames(ctx)
	if err != nil {
		return err
	}

	for _, game := range games {
		if game.ShouldTick() {
			if err := e.processGameTick(ctx, game); err != nil {
				log.Printf("Error processing game %s tick: %v", game.GameID, err)
			}
		}
	}

	return nil
}

// processGameTick processes a single game tick
func (e *GameEngine) processGameTick(ctx context.Context, game *models.Game) error {
	// Increment year (1 year per second)
	newYear := game.CurrentYear + 1

	// Update game in database
	if err := e.repo.UpdateGameTick(ctx, game.GameID, newYear, ctx); err != nil {
		return err
	}

	// Log significant milestones
	if newYear%100 == 0 {
		log.Printf("Game %s: Year %d", game.GameID, newYear)
	}

	return nil
}
