package models

import "time"

// Game represents a game instance in the database
type Game struct {
	GameID         string    `bson:"gameId"`
	CreatorUserID  string    `bson:"creatorUserId"`
	MaxPlayers     int       `bson:"maxPlayers"`
	CurrentPlayers int       `bson:"currentPlayers"`
	PlayerList     []string  `bson:"playerList"`
	State          string    `bson:"state"` // "waiting" or "started"
	CurrentYear    int       `bson:"currentYear"`
	CreatedAt      time.Time `bson:"createdAt"`
	StartedAt      *time.Time `bson:"startedAt,omitempty"`
	LastTickAt     *time.Time `bson:"lastTickAt,omitempty"`
}

// IsWaiting returns true if the game is waiting for players
func (g *Game) IsWaiting() bool {
	return g.State == "waiting"
}

// IsStarted returns true if the game has started
func (g *Game) IsStarted() bool {
	return g.State == "started"
}

// ShouldTick returns true if the game needs a tick processed
func (g *Game) ShouldTick() bool {
	if !g.IsStarted() {
		return false
	}

	if g.LastTickAt == nil {
		return true
	}

	// Tick every second (1 game year per real second)
	return time.Since(*g.LastTickAt) >= time.Second
}
