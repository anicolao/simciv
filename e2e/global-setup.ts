/**
 * Global setup for E2E tests
 * Clears the database before running tests to ensure a clean state
 */

import { MongoClient } from 'mongodb';

async function globalSetup() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'simciv';

  console.log('[Global Setup] Connecting to MongoDB...');
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);

    console.log('[Global Setup] Clearing all collections...');
    
    // Drop all collections to ensure clean state
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
      console.log(`[Global Setup] Cleared collection: ${collection.name}`);
    }

    console.log('[Global Setup] Database cleanup complete');
  } catch (error) {
    console.error('[Global Setup] Failed to clear database:', error);
    throw error;
  } finally {
    await client.close();
  }
}

export default globalSetup;
