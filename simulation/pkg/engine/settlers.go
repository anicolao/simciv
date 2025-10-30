package engine

import (
	"context"
	"log"
	"math/rand"
	"time"

	"github.com/anicolao/simciv/simulation/pkg/models"
)

// processSettlersUnits processes all settlers units in the game
func (e *GameEngine) processSettlersUnits(ctx context.Context, game *models.Game) error {
	units, err := e.repo.GetUnits(ctx, game.GameID)
	if err != nil {
		return err
	}

	for _, unit := range units {
		if unit.UnitType == "settlers" {
			if err := e.processSettlersUnit(ctx, game, unit); err != nil {
				log.Printf("Error processing settlers unit %s: %v", unit.UnitID, err)
				// Continue with other units
			}
		}
	}

	return nil
}

// processSettlersUnit processes a single settlers unit
func (e *GameEngine) processSettlersUnit(ctx context.Context, game *models.Game, unit *models.Unit) error {
	// If unit has taken fewer than 3 steps, take another step
	if unit.StepsTaken < 3 {
		return e.moveUnit(ctx, game, unit)
	}

	// If unit has taken 3 steps, settle at current location
	if unit.StepsTaken == 3 {
		return e.settleAtLocation(ctx, game, unit)
	}

	return nil
}

// moveUnit moves a unit in a random direction
func (e *GameEngine) moveUnit(ctx context.Context, game *models.Game, unit *models.Unit) error {
	// Get map metadata to know bounds
	metadata, err := e.repo.GetMapMetadata(ctx, game.GameID)
	if err != nil {
		return err
	}

	// Pick random direction: N, S, E, W
	directions := []struct {
		dx int
		dy int
	}{
		{dx: 0, dy: -1},  // North
		{dx: 0, dy: 1},   // South
		{dx: 1, dy: 0},   // East
		{dx: -1, dy: 0},  // West
	}

	// Use time-based seed for randomness
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	direction := directions[r.Intn(len(directions))]

	// Move unit
	newX := unit.Location.X + direction.dx
	newY := unit.Location.Y + direction.dy

	// Ensure within map bounds
	if newX < 0 {
		newX = 0
	}
	if newX >= metadata.Width {
		newX = metadata.Width - 1
	}
	if newY < 0 {
		newY = 0
	}
	if newY >= metadata.Height {
		newY = metadata.Height - 1
	}

	// Update unit location and stepsTaken
	unit.Location.X = newX
	unit.Location.Y = newY
	unit.StepsTaken++
	unit.LastUpdated = time.Now()

	log.Printf("Unit %s moved to (%d, %d), steps taken: %d", unit.UnitID, newX, newY, unit.StepsTaken)

	return e.repo.UpdateUnit(ctx, unit)
}

// settleAtLocation creates a settlement at the unit's location
func (e *GameEngine) settleAtLocation(ctx context.Context, game *models.Game, unit *models.Unit) error {
	location := unit.Location

	// Get tile at location
	tile, err := e.repo.GetMapTile(ctx, game.GameID, location.X, location.Y)
	if err != nil || tile == nil {
		log.Printf("Warning: Could not find tile at (%d, %d), trying adjacent tiles", location.X, location.Y)
		// Try to find a valid adjacent tile
		tile, location, err = e.findValidAdjacentTile(ctx, game.GameID, location)
		if err != nil {
			return err
		}
	}

	// If tile is ocean or shallow water, find nearest land tile
	if tile.TerrainType == "OCEAN" || tile.TerrainType == "SHALLOW_WATER" {
		log.Printf("Tile at (%d, %d) is water, finding adjacent land tile", location.X, location.Y)
		tile, location, err = e.findValidAdjacentTile(ctx, game.GameID, location)
		if err != nil {
			log.Printf("Warning: Could not find valid land tile near (%d, %d), settling on water", location.X, location.Y)
			// Settle anyway as fallback
		}
	}

	// Create settlement
	settlement := &models.Settlement{
		SettlementID: generateUUID(),
		GameID:       game.GameID,
		PlayerID:     unit.PlayerID,
		Name:         "First Settlement",
		Type:         "nomadic_camp",
		Location:     location,
		Population:   100,
		Founded:      time.Now(),
		LastUpdated:  time.Now(),
	}

	if err := e.repo.CreateSettlement(ctx, settlement); err != nil {
		return err
	}

	log.Printf("Settlement %s created at (%d, %d) for player %s", settlement.SettlementID, location.X, location.Y, unit.PlayerID)

	// Remove settlers unit
	if err := e.repo.DeleteUnit(ctx, unit.UnitID); err != nil {
		return err
	}

	log.Printf("Settlers unit %s removed after settlement", unit.UnitID)

	// Update population allocation
	population, err := e.repo.GetPopulation(ctx, game.GameID, unit.PlayerID)
	if err != nil {
		return err
	}

	population.AllocatedToUnit = 0
	population.AllocatedToSettlement = 100
	population.LastUpdated = time.Now()

	if err := e.repo.UpdatePopulation(ctx, population); err != nil {
		return err
	}

	log.Printf("Population allocation updated for player %s", unit.PlayerID)

	return nil
}

// findValidAdjacentTile finds a valid adjacent land tile
func (e *GameEngine) findValidAdjacentTile(ctx context.Context, gameID string, location models.Location) (*models.MapTile, models.Location, error) {
	// Try adjacent tiles (spiral search)
	adjacentOffsets := []struct {
		dx int
		dy int
	}{
		{dx: 1, dy: 0},
		{dx: -1, dy: 0},
		{dx: 0, dy: 1},
		{dx: 0, dy: -1},
		{dx: 1, dy: 1},
		{dx: 1, dy: -1},
		{dx: -1, dy: 1},
		{dx: -1, dy: -1},
	}

	for _, offset := range adjacentOffsets {
		adjX := location.X + offset.dx
		adjY := location.Y + offset.dy

		tile, err := e.repo.GetMapTile(ctx, gameID, adjX, adjY)
		if err != nil {
			continue
		}

		if tile != nil && tile.TerrainType != "OCEAN" && tile.TerrainType != "SHALLOW_WATER" {
			return tile, models.Location{X: adjX, Y: adjY}, nil
		}
	}

	// If no valid adjacent tile found, return original location
	tile, _ := e.repo.GetMapTile(ctx, gameID, location.X, location.Y)
	return tile, location, nil
}
