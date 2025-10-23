package models

import (
	"testing"
	"time"
)

func TestGame_IsWaiting(t *testing.T) {
	tests := []struct {
		name     string
		state    string
		expected bool
	}{
		{"Waiting game", "waiting", true},
		{"Started game", "started", false},
		{"Unknown state", "unknown", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			game := &Game{State: tt.state}
			if got := game.IsWaiting(); got != tt.expected {
				t.Errorf("IsWaiting() = %v, want %v", got, tt.expected)
			}
		})
	}
}

func TestGame_IsStarted(t *testing.T) {
	tests := []struct {
		name     string
		state    string
		expected bool
	}{
		{"Started game", "started", true},
		{"Waiting game", "waiting", false},
		{"Unknown state", "unknown", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			game := &Game{State: tt.state}
			if got := game.IsStarted(); got != tt.expected {
				t.Errorf("IsStarted() = %v, want %v", got, tt.expected)
			}
		})
	}
}

func TestGame_ShouldTick(t *testing.T) {
	now := time.Now()
	oneSecondAgo := now.Add(-1 * time.Second)
	twoSecondsAgo := now.Add(-2 * time.Second)
	halfSecondAgo := now.Add(-500 * time.Millisecond)

	tests := []struct {
		name       string
		state      string
		lastTickAt *time.Time
		expected   bool
	}{
		{"Waiting game should not tick", "waiting", nil, false},
		{"Started game with no last tick should tick", "started", nil, true},
		{"Started game ticked 2 seconds ago should tick", "started", &twoSecondsAgo, true},
		{"Started game ticked 1 second ago should tick", "started", &oneSecondAgo, true},
		{"Started game ticked 500ms ago should not tick", "started", &halfSecondAgo, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			game := &Game{
				State:      tt.state,
				LastTickAt: tt.lastTickAt,
			}
			if got := game.ShouldTick(); got != tt.expected {
				t.Errorf("ShouldTick() = %v, want %v", got, tt.expected)
			}
		})
	}
}

func TestGame_Fields(t *testing.T) {
	now := time.Now()
	game := &Game{
		GameID:         "test-game-1",
		CreatorUserID:  "user1",
		MaxPlayers:     4,
		CurrentPlayers: 2,
		PlayerList:     []string{"user1", "user2"},
		State:          "waiting",
		CurrentYear:    -5000,
		CreatedAt:      now,
		StartedAt:      nil,
		LastTickAt:     nil,
	}

	if game.GameID != "test-game-1" {
		t.Errorf("GameID = %v, want test-game-1", game.GameID)
	}
	if game.MaxPlayers != 4 {
		t.Errorf("MaxPlayers = %v, want 4", game.MaxPlayers)
	}
	if game.CurrentPlayers != 2 {
		t.Errorf("CurrentPlayers = %v, want 2", game.CurrentPlayers)
	}
	if len(game.PlayerList) != 2 {
		t.Errorf("PlayerList length = %v, want 2", len(game.PlayerList))
	}
	if game.CurrentYear != -5000 {
		t.Errorf("CurrentYear = %v, want -5000", game.CurrentYear)
	}
}
