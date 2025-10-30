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
	repo         repository.GameRepository
	e2eTestMode  bool
	manualTickCh chan string // Channel for manual tick requests (gameID)
}

// NewGameEngine creates a new game engine
func NewGameEngine(repo repository.GameRepository) *GameEngine {
	e2eTestMode := os.Getenv("E2E_TEST_MODE") == "true"
	if e2eTestMode {
		log.Println("E2E Test Mode: Automatic ticking disabled, use manual tick endpoint")
	}
	
	return &GameEngine{
		repo:         repo,
		e2eTestMode:  e2eTestMode,
		manualTickCh: make(chan string, 10),
	}
}

// TriggerManualTick triggers a manual tick for a specific game (E2E test mode only)
func (e *GameEngine) TriggerManualTick(gameID string) error {
	if !e.e2eTestMode {
		return nil // Silently ignore in production mode
	}
	
	select {
	case e.manualTickCh <- gameID:
		return nil
	default:
		return nil // Channel full, ignore
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
		case gameID := <-e.manualTickCh:
			// Manual tick for E2E test mode
			if err := e.processManualTick(ctx, gameID); err != nil {
				log.Printf("Error processing manual tick for game %s: %v", gameID, err)
			}
		case <-ticker.C:
			// Only process automatic ticks if not in E2E test mode
			if !e.e2eTestMode {
				if err := e.processTick(ctx); err != nil {
					log.Printf("Error processing tick: %v", err)
				}
			}
		}
	}
}

// processManualTick processes a manual tick for a specific game (E2E test mode)
func (e *GameEngine) processManualTick(ctx context.Context, gameID string) error {
	game, err := e.repo.GetGame(ctx, gameID)
	if err != nil {
		return err
	}
	
	if game == nil {
		log.Printf("Game %s not found for manual tick", gameID)
		return nil
	}
	
	if !game.IsStarted() {
		log.Printf("Game %s is not started, cannot tick", gameID)
		return nil
	}
	
	// Check if map needs to be generated (new game just started)
	if game.CurrentYear == -5000 && game.LastTickAt == nil {
		if err := e.generateMapForGame(ctx, game); err != nil {
			log.Printf("Error generating map for game %s: %v", game.GameID, err)
			return err
		}
	}
	
	// Force tick regardless of timing
	if err := e.processGameTick(ctx, game); err != nil {
		log.Printf("Error processing manual tick for game %s: %v", game.GameID, err)
		return err
	}
	
	log.Printf("Manual tick processed for game %s", gameID)
	return nil
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
	// Process settlers units (3-step walk and auto-settle)
	if err := e.processSettlersUnits(ctx, game); err != nil {
		log.Printf("Error processing settlers units for game %s: %v", game.GameID, err)
		// Continue with tick processing even if settlers processing fails
	}

	// Process settlement population growth
	if err := e.processSettlementGrowth(ctx, game); err != nil {
		log.Printf("Error processing settlement growth for game %s: %v", game.GameID, err)
		// Continue with tick processing even if growth processing fails
	}

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

// processSettlementGrowth processes population growth for all settlements
func (e *GameEngine) processSettlementGrowth(ctx context.Context, game *models.Game) error {
	settlements, err := e.repo.GetSettlements(ctx, game.GameID)
	if err != nil {
		return err
	}

	for _, settlement := range settlements {
		// Simple population growth: 1% per year (1 tick = 1 year)
		// At 100 population, this gives approximately 1 person per year
		// This is a simplified model for minimal settlers implementation
		growthRate := 0.01
		growth := int(float64(settlement.Population) * growthRate)
		
		// Minimum growth of 1 if population > 0
		if growth == 0 && settlement.Population > 0 {
			growth = 1
		}

		if growth > 0 {
			settlement.Population += growth
			settlement.LastUpdated = time.Now()

			if err := e.repo.UpdateSettlement(ctx, settlement); err != nil {
				log.Printf("Error updating settlement %s: %v", settlement.SettlementID, err)
				continue
			}

			// Update population tracking
			population, err := e.repo.GetPopulation(ctx, game.GameID, settlement.PlayerID)
			if err != nil {
				log.Printf("Error getting population for player %s: %v", settlement.PlayerID, err)
				continue
			}

			population.TotalPopulation += growth
			population.AllocatedToSettlement += growth
			population.LastUpdated = time.Now()

			if err := e.repo.UpdatePopulation(ctx, population); err != nil {
				log.Printf("Error updating population for player %s: %v", settlement.PlayerID, err)
				continue
			}

			// Log every 10 population increase
			if settlement.Population%10 == 0 {
				log.Printf("Settlement %s (player %s) population: %d", settlement.SettlementID, settlement.PlayerID, settlement.Population)
			}
		}
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

	// Initialize settlers units and population for each player
	for _, position := range positions {
		if position.PlayerID == "" {
			continue
		}

		// Create initial settlers unit at starting position
		unit := &models.Unit{
			UnitID:         generateUUID(),
			GameID:         game.GameID,
			PlayerID:       position.PlayerID,
			UnitType:       "settlers",
			Location: models.Location{
				X: position.StartingCityX,
				Y: position.StartingCityY,
			},
			StepsTaken:     0,
			PopulationCost: 100,
			CreatedAt:      time.Now(),
			LastUpdated:    time.Now(),
		}

		if err := e.repo.CreateUnit(ctx, unit); err != nil {
			return err
		}

		// Initialize population tracking
		population := &models.Population{
			GameID:                game.GameID,
			PlayerID:              position.PlayerID,
			TotalPopulation:       100,
			AllocatedToUnit:       100, // All pop in settlers unit initially
			AllocatedToSettlement: 0,
			Unallocated:           0,
			LastUpdated:           time.Now(),
		}

		if err := e.repo.CreatePopulation(ctx, population); err != nil {
			return err
		}

		log.Printf("Initialized settlers unit and population for player %s", position.PlayerID)
	}

	log.Printf("Map saved successfully for game %s", game.GameID)
	return nil
}

// generateUUID generates a simple UUID for units and settlements
func generateUUID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return hex.EncodeToString(b)
	}
	return hex.EncodeToString(b)
}
