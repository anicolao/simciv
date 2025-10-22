package engine

import (
	"context"
	"testing"
	"time"

	"github.com/anicolao/simciv/simulation/pkg/models"
)

// MockRepository implements GameRepository for testing
type MockRepository struct {
	games          map[string]*models.Game
	updateCalls    int
	getStartedCalls int
}

func NewMockRepository() *MockRepository {
	return &MockRepository{
		games: make(map[string]*models.Game),
	}
}

func (m *MockRepository) GetStartedGames(ctx context.Context) ([]*models.Game, error) {
	m.getStartedCalls++
	var games []*models.Game
	for _, game := range m.games {
		if game.IsStarted() {
			games = append(games, game)
		}
	}
	return games, nil
}

func (m *MockRepository) GetGame(ctx context.Context, gameID string) (*models.Game, error) {
	return m.games[gameID], nil
}

func (m *MockRepository) UpdateGameTick(ctx context.Context, gameID string, newYear int, tickTime context.Context) error {
	m.updateCalls++
	if game, exists := m.games[gameID]; exists {
		game.CurrentYear = newYear
		now := time.Now()
		game.LastTickAt = &now
	}
	return nil
}

func (m *MockRepository) Close(ctx context.Context) error {
	return nil
}

func TestGameEngine_ProcessTick(t *testing.T) {
	repo := NewMockRepository()
	engine := NewGameEngine(repo)

	// Add a started game
	now := time.Now().Add(-2 * time.Second) // 2 seconds ago
	repo.games["game1"] = &models.Game{
		GameID:      "game1",
		State:       "started",
		CurrentYear: -5000,
		LastTickAt:  &now,
	}

	// Process tick
	ctx := context.Background()
	err := engine.processTick(ctx)
	if err != nil {
		t.Fatalf("processTick failed: %v", err)
	}

	// Verify game was updated
	if repo.updateCalls != 1 {
		t.Errorf("Expected 1 update call, got %d", repo.updateCalls)
	}

	game := repo.games["game1"]
	if game.CurrentYear != -4999 {
		t.Errorf("Expected year -4999, got %d", game.CurrentYear)
	}
}

func TestGameEngine_SkipWaitingGames(t *testing.T) {
	repo := NewMockRepository()
	engine := NewGameEngine(repo)

	// Add a waiting game
	repo.games["game1"] = &models.Game{
		GameID:      "game1",
		State:       "waiting",
		CurrentYear: -5000,
	}

	// Process tick
	ctx := context.Background()
	err := engine.processTick(ctx)
	if err != nil {
		t.Fatalf("processTick failed: %v", err)
	}

	// Verify no updates (waiting games shouldn't be processed)
	if repo.updateCalls != 0 {
		t.Errorf("Expected 0 update calls for waiting game, got %d", repo.updateCalls)
	}
}

func TestGameEngine_MultipleGames(t *testing.T) {
	repo := NewMockRepository()
	engine := NewGameEngine(repo)

	// Add multiple started games
	now := time.Now().Add(-2 * time.Second)
	repo.games["game1"] = &models.Game{
		GameID:      "game1",
		State:       "started",
		CurrentYear: -5000,
		LastTickAt:  &now,
	}
	repo.games["game2"] = &models.Game{
		GameID:      "game2",
		State:       "started",
		CurrentYear: -4000,
		LastTickAt:  &now,
	}
	repo.games["game3"] = &models.Game{
		GameID:      "game3",
		State:       "waiting",
		CurrentYear: -5000,
	}

	// Process tick
	ctx := context.Background()
	err := engine.processTick(ctx)
	if err != nil {
		t.Fatalf("processTick failed: %v", err)
	}

	// Verify both started games were updated
	if repo.updateCalls != 2 {
		t.Errorf("Expected 2 update calls, got %d", repo.updateCalls)
	}

	if repo.games["game1"].CurrentYear != -4999 {
		t.Errorf("Game1: Expected year -4999, got %d", repo.games["game1"].CurrentYear)
	}
	if repo.games["game2"].CurrentYear != -3999 {
		t.Errorf("Game2: Expected year -3999, got %d", repo.games["game2"].CurrentYear)
	}
	if repo.games["game3"].CurrentYear != -5000 {
		t.Errorf("Game3: Expected year -5000 (unchanged), got %d", repo.games["game3"].CurrentYear)
	}
}

func TestGameEngine_YearProgression(t *testing.T) {
	// Add a game at different year ranges
	tests := []struct {
		name        string
		startYear   int
		expectedYear int
	}{
		{"Ancient", -5000, -4999},
		{"Classical", -1000, -999},
		{"Medieval", 500, 501},
		{"Modern", 1900, 1901},
		{"Future", 2500, 2501},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := NewMockRepository()
			engine := NewGameEngine(repo)

			now := time.Now().Add(-2 * time.Second)
			gameID := "test-game"
			repo.games[gameID] = &models.Game{
				GameID:      gameID,
				State:       "started",
				CurrentYear: tt.startYear,
				LastTickAt:  &now,
			}

			ctx := context.Background()
			err := engine.processTick(ctx)
			if err != nil {
				t.Fatalf("processTick failed: %v", err)
			}

			if repo.games[gameID].CurrentYear != tt.expectedYear {
				t.Errorf("Expected year %d, got %d", tt.expectedYear, repo.games[gameID].CurrentYear)
			}
		})
	}
}

func TestGameEngine_TickTiming(t *testing.T) {
	repo := NewMockRepository()
	engine := NewGameEngine(repo)

	// Add a game that was just ticked (should not tick again)
	justNow := time.Now().Add(-100 * time.Millisecond)
	repo.games["game1"] = &models.Game{
		GameID:      "game1",
		State:       "started",
		CurrentYear: -5000,
		LastTickAt:  &justNow,
	}

	// Add a game that needs ticking
	longAgo := time.Now().Add(-2 * time.Second)
	repo.games["game2"] = &models.Game{
		GameID:      "game2",
		State:       "started",
		CurrentYear: -5000,
		LastTickAt:  &longAgo,
	}

	// Process tick
	ctx := context.Background()
	err := engine.processTick(ctx)
	if err != nil {
		t.Fatalf("processTick failed: %v", err)
	}

	// Verify only game2 was updated
	if repo.updateCalls != 1 {
		t.Errorf("Expected 1 update call, got %d", repo.updateCalls)
	}

	if repo.games["game1"].CurrentYear != -5000 {
		t.Errorf("Game1 should not have been updated: year %d", repo.games["game1"].CurrentYear)
	}
	if repo.games["game2"].CurrentYear != -4999 {
		t.Errorf("Game2 should have been updated: year %d", repo.games["game2"].CurrentYear)
	}
}
