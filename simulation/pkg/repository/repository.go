package repository

import (
	"context"

	"github.com/anicolao/simciv/simulation/pkg/models"
)

// GameRepository defines the interface for game data access
type GameRepository interface {
	// GetStartedGames returns all games in "started" state
	GetStartedGames(ctx context.Context) ([]*models.Game, error)

	// GetGame returns a specific game by ID
	GetGame(ctx context.Context, gameID string) (*models.Game, error)

	// UpdateGameTick updates the game's current year and last tick time
	UpdateGameTick(ctx context.Context, gameID string, newYear int, tickTime context.Context) error

	// SaveMapMetadata saves map generation metadata
	SaveMapMetadata(ctx context.Context, metadata *models.MapMetadata) error

	// SaveMapTiles saves map tiles in batch
	SaveMapTiles(ctx context.Context, tiles []*models.MapTile) error

	// SaveStartingPositions saves player starting positions
	SaveStartingPositions(ctx context.Context, positions []*models.StartingPosition) error

	// GetMapMetadata retrieves map metadata for a game
	GetMapMetadata(ctx context.Context, gameID string) (*models.MapMetadata, error)

	// GetMapTiles retrieves map tiles for a game (with optional filtering)
	GetMapTiles(ctx context.Context, gameID string, playerID *string) ([]*models.MapTile, error)

	// GetStartingPosition retrieves a player's starting position
	GetStartingPosition(ctx context.Context, gameID string, playerID string) (*models.StartingPosition, error)

	// CreateUnit creates a new unit
	CreateUnit(ctx context.Context, unit *models.Unit) error

	// GetUnits retrieves units for a game
	GetUnits(ctx context.Context, gameID string) ([]*models.Unit, error)

	// GetUnitsByPlayer retrieves units for a specific player
	GetUnitsByPlayer(ctx context.Context, gameID string, playerID string) ([]*models.Unit, error)

	// UpdateUnit updates a unit
	UpdateUnit(ctx context.Context, unit *models.Unit) error

	// DeleteUnit deletes a unit
	DeleteUnit(ctx context.Context, unitID string) error

	// CreateSettlement creates a new settlement
	CreateSettlement(ctx context.Context, settlement *models.Settlement) error

	// GetSettlements retrieves settlements for a game
	GetSettlements(ctx context.Context, gameID string) ([]*models.Settlement, error)

	// GetSettlementsByPlayer retrieves settlements for a specific player
	GetSettlementsByPlayer(ctx context.Context, gameID string, playerID string) ([]*models.Settlement, error)

	// UpdateSettlement updates a settlement
	UpdateSettlement(ctx context.Context, settlement *models.Settlement) error

	// GetMapTile retrieves a specific tile by coordinates
	GetMapTile(ctx context.Context, gameID string, x int, y int) (*models.MapTile, error)

	// Close closes the repository connection
	Close(ctx context.Context) error
}
