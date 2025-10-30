import { MongoClient, Db, Collection } from 'mongodb';
import { User, Session, Challenge, Game, MapTile, StartingPosition, MapMetadata, Unit, Settlement } from '../models/types';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(uri: string, dbName: string): Promise<Db> {
  if (db) {
    return db;
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);

  // Create indexes
  await db.collection<User>('users').createIndex({ alias: 1 }, { unique: true });
  await db.collection<Session>('sessions').createIndex({ sessionGuid: 1 }, { unique: true });
  await db.collection<Session>('sessions').createIndex({ expiresAt: 1 });
  await db.collection<Challenge>('challenges').createIndex({ alias: 1 });
  await db.collection<Challenge>('challenges').createIndex({ expiresAt: 1 });
  await db.collection<Game>('games').createIndex({ gameId: 1 }, { unique: true });
  await db.collection<Game>('games').createIndex({ state: 1 });
  await db.collection<Game>('games').createIndex({ createdAt: 1 });
  
  // Map-related indexes
  await db.collection<MapTile>('mapTiles').createIndex({ gameId: 1, x: 1, y: 1 }, { unique: true });
  await db.collection<MapTile>('mapTiles').createIndex({ gameId: 1 });
  await db.collection<MapTile>('mapTiles').createIndex({ gameId: 1, visibleTo: 1 });
  await db.collection<StartingPosition>('startingPositions').createIndex({ gameId: 1, playerId: 1 }, { unique: true });
  await db.collection<StartingPosition>('startingPositions').createIndex({ gameId: 1 });
  await db.collection<MapMetadata>('mapMetadata').createIndex({ gameId: 1 }, { unique: true });

  // Minimal settlers indexes
  await db.collection<Unit>('units').createIndex({ unitId: 1 }, { unique: true });
  await db.collection<Unit>('units').createIndex({ gameId: 1 });
  await db.collection<Unit>('units').createIndex({ gameId: 1, playerId: 1 });
  await db.collection<Settlement>('settlements').createIndex({ settlementId: 1 }, { unique: true });
  await db.collection<Settlement>('settlements').createIndex({ gameId: 1 });
  await db.collection<Settlement>('settlements').createIndex({ gameId: 1, playerId: 1 });

  return db;
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase first.');
  }
  return db;
}

export function getUsersCollection(): Collection<User> {
  return getDatabase().collection<User>('users');
}

export function getSessionsCollection(): Collection<Session> {
  return getDatabase().collection<Session>('sessions');
}

export function getChallengesCollection(): Collection<Challenge> {
  return getDatabase().collection<Challenge>('challenges');
}

export function getGamesCollection(): Collection<Game> {
  return getDatabase().collection<Game>('games');
}

export function getMapTilesCollection(): Collection<MapTile> {
  return getDatabase().collection<MapTile>('mapTiles');
}

export function getStartingPositionsCollection(): Collection<StartingPosition> {
  return getDatabase().collection<StartingPosition>('startingPositions');
}

export function getMapMetadataCollection(): Collection<MapMetadata> {
  return getDatabase().collection<MapMetadata>('mapMetadata');
}

export function getUnitsCollection(): Collection<Unit> {
  return getDatabase().collection<Unit>('units');
}

export function getSettlementsCollection(): Collection<Settlement> {
  return getDatabase().collection<Settlement>('settlements');
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
