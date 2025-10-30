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

/**
 * Reset deterministic UUID counter on the server
 */
export async function resetUuidCounter() {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseURL}/api/test/reset-uuid-counter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('[UUID Counter Reset] Failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('[UUID Counter Reset] Error:', error);
    // Don't throw - this is not critical for test execution
  }
}

async function globalSetup() {
  console.log('[Global Setup] Connecting to MongoDB...');
  console.log('[Global Setup] Setting E2E_TEST_MODE environment variable...');
  
  // Set E2E_TEST_MODE for deterministic UUID generation
  process.env.E2E_TEST_MODE = '1';
  
  console.log('[Global Setup] Clearing all collections...');
  await clearDatabase();
  
  console.log('[Global Setup] Database cleanup complete');
}

export default globalSetup;
