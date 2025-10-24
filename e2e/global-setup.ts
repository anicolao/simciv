/**
 * Global setup for E2E tests
 * Clears the database before running tests to ensure a clean state
 */

import { MongoClient } from 'mongodb';

export async function clearDatabase() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'simciv';

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // Drop all collections to ensure clean state
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  } catch (error) {
    console.error('[Database Cleanup] Failed to clear database:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function globalSetup() {
  console.log('[Global Setup] Connecting to MongoDB...');
  console.log('[Global Setup] Clearing all collections...');
  
  await clearDatabase();
  
  console.log('[Global Setup] Database cleanup complete');
}

export default globalSetup;
