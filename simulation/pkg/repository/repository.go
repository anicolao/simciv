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

	// Close closes the repository connection
	Close(ctx context.Context) error
}
