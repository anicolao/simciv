package engine

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log"
	"os"
	"time"

	"github.com/anicolao/simciv/simulation/pkg/mapgen"
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
		// Check if map needs to be generated (new game just started)
		if game.CurrentYear == -5000 && game.LastTickAt == nil {
			// Generate map for new game
			if err := e.generateMapForGame(ctx, game); err != nil {
				log.Printf("Error generating map for game %s: %v", game.GameID, err)
				continue
			}
		}

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

// generateMapForGame generates the map when a game starts
func (e *GameEngine) generateMapForGame(ctx context.Context, game *models.Game) error {
	log.Printf("Generating map for game %s with %d players", game.GameID, game.MaxPlayers)

	// Generate seed
	var seed string
	testSeed := os.Getenv("TEST_MAP_SEED")
	if testSeed != "" {
		// Use deterministic seed for testing
		seed = testSeed
		log.Printf("Using test seed: %s", seed)
	} else {
		// Generate random seed for production
		seedBytes := make([]byte, 16)
		if _, err := rand.Read(seedBytes); err != nil {
			return err
		}
		seed = hex.EncodeToString(seedBytes)
	}

	// Create generator
	generator := mapgen.NewGenerator(seed, game.MaxPlayers)

	// Generate map
	metadata, tiles, positions, err := generator.GenerateMap(ctx, game.GameID, game.MaxPlayers)
	if err != nil {
		return err
	}

	log.Printf("Generated map: %dx%d with %d tiles, %d starting positions in %dms",
		metadata.Width, metadata.Height, len(tiles), len(positions), metadata.GenerationTimeMs)

	// Update starting positions with actual player IDs
	for i, position := range positions {
		if i < len(game.PlayerList) {
			position.PlayerID = game.PlayerList[i]
			position.GameID = game.GameID
			position.CreatedAt = time.Now()
		}
	}

	// Initialize tile visibility for all players
	// Each player can see tiles around their starting position
	for _, position := range positions {
		if position.PlayerID == "" {
			continue
		}
		// Make tiles within vision range visible to this player
		visionRange := 3 // tiles around starting position
		for _, tile := range tiles {
			dx := tile.X - position.CenterX
			dy := tile.Y - position.CenterY
			distanceSquared := dx*dx + dy*dy
			if distanceSquared <= visionRange*visionRange {
				tile.VisibleTo = append(tile.VisibleTo, position.PlayerID)
			}
		}
	}

	// Save to database
	if err := e.repo.SaveMapMetadata(ctx, metadata); err != nil {
		return err
	}

	if err := e.repo.SaveMapTiles(ctx, tiles); err != nil {
		return err
	}

	if err := e.repo.SaveStartingPositions(ctx, positions); err != nil {
		return err
	}

	log.Printf("Map saved successfully for game %s", game.GameID)
	return nil
}
