import { MongoClient, Db, Collection } from 'mongodb';
import { User, Session, Challenge } from '../models/types';

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

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
