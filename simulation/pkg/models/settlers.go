package models

import "time"

// Unit represents a game unit (settlers, warriors, etc.)
type Unit struct {
	UnitID         string    `bson:"unitId"`
	GameID         string    `bson:"gameId"`
	PlayerID       string    `bson:"playerId"`
	UnitType       string    `bson:"unitType"` // "settlers" for minimal implementation
	Location       Location  `bson:"location"`
	StepsTaken     int       `bson:"stepsTaken"`
	PopulationCost int       `bson:"populationCost"` // Fixed at 100 for settlers
	CreatedAt      time.Time `bson:"createdAt"`
	LastUpdated    time.Time `bson:"lastUpdated"`
}

// Settlement represents a player settlement
type Settlement struct {
	SettlementID string    `bson:"settlementId"`
	GameID       string    `bson:"gameId"`
	PlayerID     string    `bson:"playerId"`
	Name         string    `bson:"name"`
	Type         string    `bson:"type"` // "nomadic_camp" for minimal implementation
	Location     Location  `bson:"location"`
	Founded      time.Time `bson:"founded"`
	LastUpdated  time.Time `bson:"lastUpdated"`
}

// Location represents a position on the map
type Location struct {
	X int `bson:"x"`
	Y int `bson:"y"`
}
