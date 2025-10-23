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

	// Close closes the repository connection
	Close(ctx context.Context) error
}
