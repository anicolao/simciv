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

// Close closes the MongoDB connection
func (r *MongoRepository) Close(ctx context.Context) error {
	if r.client != nil {
		return r.client.Disconnect(ctx)
	}
	return nil
}
