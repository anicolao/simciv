import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../helpers/testDb';
import * as dbConnection from '../../db/connection';
import { sessionMiddleware } from '../../middleware/session';
import authRoutes from '../../routes/auth';
import sessionRoutes from '../../routes/session';

// Mock the database connection module
vi.mock('../../db/connection');

describe('Authentication Integration Tests', () => {
  let app: express.Application;
  let testKeyPair: crypto.KeyPairSyncResult<string, string>;

  beforeAll(async () => {
    // Setup test database
    const db = await setupTestDatabase();
    
    // Mock database functions to use test database
    vi.mocked(dbConnection.getUsersCollection).mockImplementation(() => 
      db.collection('users')
    );
    vi.mocked(dbConnection.getSessionsCollection).mockImplementation(() => 
      db.collection('sessions')
    );
    vi.mocked(dbConnection.getChallengesCollection).mockImplementation(() => 
      db.collection('challenges')
    );

    // Generate test key pair
    testKeyPair = crypto.generateKeyPairSync('rsa', {
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

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(sessionMiddleware);
    app.use('/api/auth', authRoutes);
    app.use('/api/session', sessionRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('POST /api/auth/check-alias', () => {
    it('should return available for new alias', async () => {
      const res = await request(app)
        .post('/api/auth/check-alias')
        .send({ alias: 'newuser' });

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(true);
    });

    it('should return unavailable for existing alias', async () => {
      // First, register a user
      await request(app)
        .post('/api/auth/register')
        .send({
          alias: 'existinguser',
          publicKey: testKeyPair.publicKey,
        });

      // Check if alias is available
      const res = await request(app)
        .post('/api/auth/check-alias')
        .send({ alias: 'existinguser' });

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false);
    });

    it('should reject invalid alias', async () => {
      const res = await request(app)
        .post('/api/auth/check-alias')
        .send({ alias: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          alias: 'testuser',
          publicKey: testKeyPair.publicKey,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.alias).toBe('testuser');
    });

    it('should reject registration with existing alias', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send({
          alias: 'testuser',
          publicKey: testKeyPair.publicKey,
        });

      // Try to register with same alias
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          alias: 'testuser',
          publicKey: testKeyPair.publicKey,
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already taken');
    });

    it('should reject registration with invalid public key', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          alias: 'testuser',
          publicKey: 'invalid key',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid public key');
    });

    it('should reject registration with weak key', async () => {
      // Testing weak key rejection - this 1024-bit key is intentionally weak
      // to verify our validation logic properly rejects insufficient key sizes
      const weakKeyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 1024,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          alias: 'testuser',
          publicKey: weakKeyPair.publicKey,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('2048 bits');
    });
  });

  describe('Authentication Flow', () => {
    beforeEach(async () => {
      // Register a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          alias: 'testuser',
          publicKey: testKeyPair.publicKey,
        });
    });

    it('should complete full authentication flow', async () => {
      // Step 1: Request challenge
      const challengeRes = await request(app)
        .post('/api/auth/challenge')
        .send({ alias: 'testuser' });

      expect(challengeRes.status).toBe(200);
      expect(challengeRes.body.challengeId).toBeDefined();
      expect(challengeRes.body.encryptedChallenge).toBeDefined();

      // Step 2: Decrypt challenge with private key
      const encryptedBuffer = Buffer.from(challengeRes.body.encryptedChallenge, 'base64');
      const decryptedChallenge = crypto.privateDecrypt(
        {
          key: testKeyPair.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        encryptedBuffer
      );
      const challengeText = decryptedChallenge.toString('utf-8');

      // Step 3: Submit response
      const respondRes = await request(app)
        .post('/api/auth/respond')
        .send({
          challengeId: challengeRes.body.challengeId,
          response: challengeText,
        });

      expect(respondRes.status).toBe(200);
      expect(respondRes.body.success).toBe(true);
      expect(respondRes.body.alias).toBe('testuser');
    });

    it('should reject wrong challenge response', async () => {
      // Request challenge
      const challengeRes = await request(app)
        .post('/api/auth/challenge')
        .send({ alias: 'testuser' });

      // Submit wrong response
      const respondRes = await request(app)
        .post('/api/auth/respond')
        .send({
          challengeId: challengeRes.body.challengeId,
          response: 'wrong response',
        });

      expect(respondRes.status).toBe(401);
    });

    it('should reject reused challenge', async () => {
      // Request challenge
      const challengeRes = await request(app)
        .post('/api/auth/challenge')
        .send({ alias: 'testuser' });

      // Decrypt challenge
      const encryptedBuffer = Buffer.from(challengeRes.body.encryptedChallenge, 'base64');
      const decryptedChallenge = crypto.privateDecrypt(
        {
          key: testKeyPair.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        encryptedBuffer
      );
      const challengeText = decryptedChallenge.toString('utf-8');

      // Submit response first time
      await request(app)
        .post('/api/auth/respond')
        .send({
          challengeId: challengeRes.body.challengeId,
          response: challengeText,
        });

      // Try to submit same response again
      const secondRes = await request(app)
        .post('/api/auth/respond')
        .send({
          challengeId: challengeRes.body.challengeId,
          response: challengeText,
        });

      expect(secondRes.status).toBe(400);
      expect(secondRes.body.error).toContain('already used');
    });
  });

  describe('Session Management', () => {
    it('should create session on first request', async () => {
      const res = await request(app)
        .get('/api/session/status');

      expect(res.status).toBe(200);
      expect(res.body.sessionGuid).toBeDefined();
      expect(res.body.state).toBe('unauthenticated');
    });

    it('should maintain session across requests', async () => {
      const agent = request.agent(app);

      // First request
      const res1 = await agent.get('/api/session/status');
      const guid1 = res1.body.sessionGuid;

      // Second request
      const res2 = await agent.get('/api/session/status');
      const guid2 = res2.body.sessionGuid;

      expect(guid1).toBe(guid2);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should terminate session on logout', async () => {
      const agent = request.agent(app);

      // Get session
      const statusRes = await agent.get('/api/session/status');
      expect(statusRes.body.state).toBe('unauthenticated');

      // Logout
      const logoutRes = await agent.post('/api/auth/logout');
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
    });
  });
});
