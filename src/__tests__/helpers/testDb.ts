import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function setupTestDatabase(): Promise<Db> {
  // Always use external MongoDB for testing
  const externalMongoUri = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017';
  
  client = new MongoClient(externalMongoUri);
  await client.connect();
  db = client.db('simciv_test');
  
  return db;
}

export async function teardownTestDatabase(): Promise<void> {
  if (client) {
    await client.close();
  }
  client = null;
  db = null;
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
