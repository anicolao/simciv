package models

import "time"

// MapTile represents a single tile on the game map
type MapTile struct {
	GameID       string    `bson:"gameId"`
	X            int       `bson:"x"`
	Y            int       `bson:"y"`
	Elevation    int       `bson:"elevation"`    // Meters above sea level (-100 to 3000)
	TerrainType  string    `bson:"terrainType"`  // OCEAN, GRASSLAND, FOREST, MOUNTAIN, etc.
	ClimateZone  string    `bson:"climateZone"`  // POLAR, TEMPERATE, TROPICAL, etc.
	HasRiver     bool      `bson:"hasRiver"`     // True if river flows through tile
	IsCoastal    bool      `bson:"isCoastal"`    // True if land adjacent to water
	Resources    []string  `bson:"resources"`    // Array of resource types on this tile
	Improvements []string  `bson:"improvements"` // Player-built improvements
	OwnerID      *string   `bson:"ownerId,omitempty"`
	VisibleTo    []string  `bson:"visibleTo"`
	CreatedAt    time.Time `bson:"createdAt"`
}

// StartingPosition represents a player's starting position on the map
type StartingPosition struct {
	GameID            string    `bson:"gameId"`
	PlayerID          string    `bson:"playerId"`
	CenterX           int       `bson:"centerX"`
	CenterY           int       `bson:"centerY"`
	StartingCityX     int       `bson:"startingCityX"`
	StartingCityY     int       `bson:"startingCityY"`
	RegionScore       float64   `bson:"regionScore"`
	RevealedTiles     int       `bson:"revealedTiles"`
	GuaranteedFootprint struct {
		MinX int `bson:"minX"`
		MaxX int `bson:"maxX"`
		MinY int `bson:"minY"`
		MaxY int `bson:"maxY"`
	} `bson:"guaranteedFootprint"`
	CreatedAt time.Time `bson:"createdAt"`
}

// GreatCircle represents a great circle used for terrain generation
type GreatCircle struct {
	CenterLon      float64 `bson:"centerLon"`
	CenterLat      float64 `bson:"centerLat"`
	VectorX        float64 `bson:"vectorX"`
	VectorY        float64 `bson:"vectorY"`
	VectorZ        float64 `bson:"vectorZ"`
	Type           string  `bson:"type"` // continental_boundary, mountain_range, ocean_trench
	Radius         float64 `bson:"radius"`
	HeightModifier float64 `bson:"heightModifier"`
	Weight         float64 `bson:"weight"`
}

// MapMetadata stores metadata about map generation
type MapMetadata struct {
	GameID           string        `bson:"gameId"`
	Seed             string        `bson:"seed"`
	Width            int           `bson:"width"`
	Height           int           `bson:"height"`
	PlayerCount      int           `bson:"playerCount"`
	SeaLevel         int           `bson:"seaLevel"`
	GreatCircles     []GreatCircle `bson:"greatCircles"`
	GeneratedAt      time.Time     `bson:"generatedAt"`
	GenerationTimeMs int64         `bson:"generationTimeMs"`
}
