import { MongoClient, Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;
let client: MongoClient | null = null;
let db: Db | null = null;

export async function setupTestDatabase(): Promise<Db> {
  // Check if we should use external MongoDB for testing
  const externalMongoUri = process.env.TEST_MONGO_URI;
  
  let uri: string;
  
  if (externalMongoUri) {
    // Use external MongoDB instance
    uri = externalMongoUri;
  } else {
    // Use MongoDB Memory Server
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }
  
  client = new MongoClient(uri);
  await client.connect();
  db = client.db('simciv_test');
  
  return db;
}

export async function teardownTestDatabase(): Promise<void> {
  if (client) {
    await client.close();
  }
  if (mongod) {
    await mongod.stop();
  }
  client = null;
  db = null;
  mongod = null;
}

export async function clearTestDatabase(): Promise<void> {
  if (db) {
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  }
}

export function getTestDatabase(): Db {
  if (!db) {
    throw new Error('Test database not initialized');
  }
  return db;
}
