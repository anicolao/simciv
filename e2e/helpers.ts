/**
 * E2E Test Helpers for SimCiv
 * 
 * This module provides utilities for E2E tests, including:
 * - Pre-generating RSA key pairs for test users
 * - Seeding the database with test users
 * - Injecting keys into browser localStorage
 */

import crypto from 'crypto';
import { MongoClient, Db } from 'mongodb';

export interface TestUser {
  alias: string;
  password: string;
  publicKey: string;
  privateKey: string;
  sessionGuid: string;
  encryptedPrivateKey: {
    encryptedKey: number[];
    salt: number[];
    iv: number[];
    algorithm: string;
    keyDerivation: {
      function: string;
      iterations: number;
      hash: string;
    };
    version: number;
    createdAt: string;
  };
}

/**
 * Generate RSA key pair using Node.js crypto (fast)
 * This is much faster than browser's Web Crypto API
 */
export function generateRSAKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { publicKey, privateKey };
}

/**
 * Encrypt private key with password (Node.js implementation)
 * Matches the browser-side encryption in client/src/utils/crypto.ts
 */
export function encryptPrivateKeyWithPassword(
  privateKeyPem: string,
  password: string
): TestUser['encryptedPrivateKey'] {
  // Convert PEM to DER (same as browser's exportKey)
  const privateKeyDer = crypto
    .createPrivateKey(privateKeyPem)
    .export({ type: 'pkcs8', format: 'der' });

  // Generate salt and IV
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);

  // Derive key using PBKDF2 (matching browser's 100,000 iterations)
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  // Encrypt using AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(privateKeyDer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine encrypted data with auth tag (GCM mode)
  const encryptedWithTag = Buffer.concat([encrypted, authTag]);

  return {
    encryptedKey: Array.from(encryptedWithTag),
    salt: Array.from(salt),
    iv: Array.from(iv),
    algorithm: 'AES-GCM',
    keyDerivation: {
      function: 'PBKDF2',
      iterations: 100000,
      hash: 'SHA-256',
    },
    version: 1,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create a test user with pre-generated keys
 */
export function createTestUser(alias: string, password: string): TestUser {
  const { publicKey, privateKey } = generateRSAKeyPair();
  const sessionGuid = crypto.randomUUID();
  const encryptedPrivateKey = encryptPrivateKeyWithPassword(privateKey, password);

  return {
    alias,
    password,
    publicKey,
    privateKey,
    sessionGuid,
    encryptedPrivateKey,
  };
}

/**
 * Seed database with a test user
 */
export async function seedTestUser(testUser: TestUser): Promise<void> {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'simciv';

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // Insert user into users collection
    const usersCollection = db.collection('users');
    await usersCollection.insertOne({
      alias: testUser.alias,
      publicKey: testUser.publicKey,
      accountStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create session in sessions collection
    const sessionsCollection = db.collection('sessions');
    await sessionsCollection.insertOne({
      sessionGuid: testUser.sessionGuid,
      state: 'unauthenticated',
      userId: null,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    console.log(`✅ Seeded test user: ${testUser.alias} (session: ${testUser.sessionGuid})`);
  } finally {
    await client.close();
  }
}

/**
 * Clean up test user from database
 */
export async function cleanupTestUser(alias: string): Promise<void> {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'simciv';

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);

    await db.collection('users').deleteOne({ alias });
    console.log(`🧹 Cleaned up test user: ${alias}`);
  } finally {
    await client.close();
  }
}

/**
 * Generate JavaScript code to inject keys into browser localStorage
 * This code can be executed in the browser context via Playwright's page.evaluate()
 */
export function getLocalStorageInjectionCode(testUser: TestUser): string {
  return `
    // Inject encrypted private key into localStorage (matches client storage format)
    localStorage.setItem(
      'simciv_${testUser.sessionGuid}_privatekey',
      JSON.stringify(${JSON.stringify(testUser.encryptedPrivateKey)})
    );
    
    // Store alias
    localStorage.setItem('simciv_${testUser.sessionGuid}_alias', '${testUser.alias}');
    
    console.log('✅ Injected keys for session ${testUser.sessionGuid}');
  `;
}

/**
 * Get cookie data for setting session cookie in browser
 */
export function getSessionCookie(sessionGuid: string) {
  return {
    name: 'simciv_session',
    value: sessionGuid,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax' as const,
  };
}

/**
 * Authenticate session in database (simulate successful login)
 */
export async function authenticateSession(
  sessionGuid: string,
  userId: string
): Promise<void> {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'simciv';

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);

    await db.collection('sessions').updateOne(
      { sessionGuid },
      {
        $set: {
          state: 'authenticated',
          userId: userId,
          lastAccessedAt: new Date(),
        },
      }
    );

    console.log(`✅ Authenticated session ${sessionGuid} for user ${userId}`);
  } finally {
    await client.close();
  }
}

/**
 * Performance measurement utility
 */
export function measureTime<T>(label: string, fn: () => T): T {
  const start = Date.now();
  const result = fn();
  const duration = Date.now() - start;
  console.log(`⏱️  ${label}: ${duration}ms`);
  return result;
}

/**
 * Async performance measurement utility
 */
export async function measureTimeAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  console.log(`⏱️  ${label}: ${duration}ms`);
  return result;
}
