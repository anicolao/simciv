package repository

import (
	"context"
	"time"

	"github.com/anicolao/simciv/simulation/pkg/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoRepository implements GameRepository using MongoDB
type MongoRepository struct {
	client *mongo.Client
	db     *mongo.Database
}

// NewMongoRepository creates a new MongoDB repository
func NewMongoRepository(ctx context.Context, uri string, dbName string) (*MongoRepository, error) {
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}

	// Ping to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		return nil, err
	}

	return &MongoRepository{
		client: client,
		db:     client.Database(dbName),
	}, nil
}

// GetStartedGames returns all games in "started" state
func (r *MongoRepository) GetStartedGames(ctx context.Context) ([]*models.Game, error) {
	collection := r.db.Collection("games")

	cursor, err := collection.Find(ctx, bson.M{"state": "started"})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var games []*models.Game
	if err := cursor.All(ctx, &games); err != nil {
		return nil, err
	}

	return games, nil
}

// GetGame returns a specific game by ID
func (r *MongoRepository) GetGame(ctx context.Context, gameID string) (*models.Game, error) {
	collection := r.db.Collection("games")

	var game models.Game
	err := collection.FindOne(ctx, bson.M{"gameId": gameID}).Decode(&game)
	if err != nil {
		return nil, err
	}

	return &game, nil
}

// UpdateGameTick updates the game's current year and last tick time
func (r *MongoRepository) UpdateGameTick(ctx context.Context, gameID string, newYear int, tickTime context.Context) error {
	collection := r.db.Collection("games")

	now := time.Now()
	_, err := collection.UpdateOne(
		ctx,
		bson.M{"gameId": gameID},
		bson.M{
			"$set": bson.M{
				"currentYear": newYear,
				"lastTickAt":  now,
			},
		},
	)

	return err
}

// SaveMapMetadata saves map generation metadata
func (r *MongoRepository) SaveMapMetadata(ctx context.Context, metadata *models.MapMetadata) error {
	collection := r.db.Collection("mapMetadata")
	_, err := collection.InsertOne(ctx, metadata)
	return err
}

// SaveMapTiles saves map tiles in batch
func (r *MongoRepository) SaveMapTiles(ctx context.Context, tiles []*models.MapTile) error {
	if len(tiles) == 0 {
		return nil
	}

	collection := r.db.Collection("mapTiles")

	// Convert to []interface{} for InsertMany
	docs := make([]interface{}, len(tiles))
	for i, tile := range tiles {
		docs[i] = tile
	}

	// Insert in batches to avoid memory issues
	batchSize := 1000
	for i := 0; i < len(docs); i += batchSize {
		end := i + batchSize
		if end > len(docs) {
			end = len(docs)
		}
		_, err := collection.InsertMany(ctx, docs[i:end])
		if err != nil {
			return err
		}
	}

	return nil
}

// SaveStartingPositions saves player starting positions
func (r *MongoRepository) SaveStartingPositions(ctx context.Context, positions []*models.StartingPosition) error {
	if len(positions) == 0 {
		return nil
	}

	collection := r.db.Collection("startingPositions")

	docs := make([]interface{}, len(positions))
	for i, pos := range positions {
		docs[i] = pos
	}

	_, err := collection.InsertMany(ctx, docs)
	return err
}

// GetMapMetadata retrieves map metadata for a game
func (r *MongoRepository) GetMapMetadata(ctx context.Context, gameID string) (*models.MapMetadata, error) {
	collection := r.db.Collection("mapMetadata")

	var metadata models.MapMetadata
	err := collection.FindOne(ctx, bson.M{"gameId": gameID}).Decode(&metadata)
	if err != nil {
		return nil, err
	}

	return &metadata, nil
}

// GetMapTiles retrieves map tiles for a game (with optional player visibility filtering)
func (r *MongoRepository) GetMapTiles(ctx context.Context, gameID string, playerID *string) ([]*models.MapTile, error) {
	collection := r.db.Collection("mapTiles")

	filter := bson.M{"gameId": gameID}
	if playerID != nil {
		// Filter by visible tiles only
		filter["visibleTo"] = *playerID
	}

	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tiles []*models.MapTile
	if err := cursor.All(ctx, &tiles); err != nil {
		return nil, err
	}

	return tiles, nil
}

// GetStartingPosition retrieves a player's starting position
func (r *MongoRepository) GetStartingPosition(ctx context.Context, gameID string, playerID string) (*models.StartingPosition, error) {
	collection := r.db.Collection("startingPositions")

	var position models.StartingPosition
	err := collection.FindOne(ctx, bson.M{
		"gameId":   gameID,
		"playerId": playerID,
	}).Decode(&position)
	if err != nil {
		return nil, err
	}

	return &position, nil
}

// CreateUnit creates a new unit
func (r *MongoRepository) CreateUnit(ctx context.Context, unit *models.Unit) error {
	collection := r.db.Collection("units")
	_, err := collection.InsertOne(ctx, unit)
	return err
}

// GetUnits retrieves units for a game
func (r *MongoRepository) GetUnits(ctx context.Context, gameID string) ([]*models.Unit, error) {
	collection := r.db.Collection("units")

	cursor, err := collection.Find(ctx, bson.M{"gameId": gameID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var units []*models.Unit
	if err := cursor.All(ctx, &units); err != nil {
		return nil, err
	}

	return units, nil
}

// GetUnitsByPlayer retrieves units for a specific player
func (r *MongoRepository) GetUnitsByPlayer(ctx context.Context, gameID string, playerID string) ([]*models.Unit, error) {
	collection := r.db.Collection("units")

	cursor, err := collection.Find(ctx, bson.M{
		"gameId":   gameID,
		"playerId": playerID,
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var units []*models.Unit
	if err := cursor.All(ctx, &units); err != nil {
		return nil, err
	}

	return units, nil
}

// UpdateUnit updates a unit
func (r *MongoRepository) UpdateUnit(ctx context.Context, unit *models.Unit) error {
	collection := r.db.Collection("units")

	_, err := collection.UpdateOne(
		ctx,
		bson.M{"unitId": unit.UnitID},
		bson.M{"$set": unit},
	)

	return err
}

// DeleteUnit deletes a unit
func (r *MongoRepository) DeleteUnit(ctx context.Context, unitID string) error {
	collection := r.db.Collection("units")
	_, err := collection.DeleteOne(ctx, bson.M{"unitId": unitID})
	return err
}

// CreateSettlement creates a new settlement
func (r *MongoRepository) CreateSettlement(ctx context.Context, settlement *models.Settlement) error {
	collection := r.db.Collection("settlements")
	_, err := collection.InsertOne(ctx, settlement)
	return err
}

// GetSettlements retrieves settlements for a game
func (r *MongoRepository) GetSettlements(ctx context.Context, gameID string) ([]*models.Settlement, error) {
	collection := r.db.Collection("settlements")

	cursor, err := collection.Find(ctx, bson.M{"gameId": gameID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var settlements []*models.Settlement
	if err := cursor.All(ctx, &settlements); err != nil {
		return nil, err
	}

	return settlements, nil
}

// GetSettlementsByPlayer retrieves settlements for a specific player
func (r *MongoRepository) GetSettlementsByPlayer(ctx context.Context, gameID string, playerID string) ([]*models.Settlement, error) {
	collection := r.db.Collection("settlements")

	cursor, err := collection.Find(ctx, bson.M{
		"gameId":   gameID,
		"playerId": playerID,
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var settlements []*models.Settlement
	if err := cursor.All(ctx, &settlements); err != nil {
		return nil, err
	}

	return settlements, nil
}

// UpdateSettlement updates a settlement
func (r *MongoRepository) UpdateSettlement(ctx context.Context, settlement *models.Settlement) error {
	collection := r.db.Collection("settlements")

	_, err := collection.UpdateOne(
		ctx,
		bson.M{"settlementId": settlement.SettlementID},
		bson.M{"$set": settlement},
	)

	return err
}

// GetMapTile retrieves a specific tile by coordinates
func (r *MongoRepository) GetMapTile(ctx context.Context, gameID string, x int, y int) (*models.MapTile, error) {
	collection := r.db.Collection("mapTiles")

	var tile models.MapTile
	err := collection.FindOne(ctx, bson.M{
		"gameId": gameID,
		"x":      x,
		"y":      y,
	}).Decode(&tile)
	if err != nil {
		return nil, err
	}

	return &tile, nil
}

// Close closes the MongoDB connection
func (r *MongoRepository) Close(ctx context.Context) error {
	if r.client != nil {
		return r.client.Disconnect(ctx)
	}
	return nil
}
