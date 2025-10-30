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
 * Enable E2E test mode on the server
 */
export async function enableE2ETestMode() {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseURL}/api/test/enable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('[E2E Test Mode] Failed to enable:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('[E2E Test Mode] Error enabling:', error);
    // Don't throw - this is not critical for test execution
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

/**
 * Trigger a manual tick for a specific game (E2E test mode only)
 */
export async function triggerManualTick(gameId: string) {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseURL}/api/test/tick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ gameId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('[Manual Tick] Failed:', response.status, error);
      throw new Error(`Failed to trigger tick: ${error.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Manual Tick] Error:', error);
    throw error;
  }
}

async function globalSetup() {
  console.log('[Global Setup] Connecting to MongoDB...');
  console.log('[Global Setup] Clearing all collections...');
  await clearDatabase();
  
  console.log('[Global Setup] Database cleanup complete');
}

export default globalSetup;
