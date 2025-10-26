import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { connectToDatabase, closeDatabase, getUsersCollection, getSessionsCollection, getGamesCollection } from '../../db/connection';
import { sessionMiddleware } from '../../middleware/session';
import authRoutes from '../../routes/auth';
import gamesRoutes from '../../routes/games';
import { User, Session } from '../../models/types';

describe('Game Integration Tests', () => {
  let app: Express;
  let agent1: request.SuperAgentTest;
  let agent2: request.SuperAgentTest;
  let agent3: request.SuperAgentTest;

  beforeEach(async () => {
    // Always use external MongoDB for testing
    const mongoUri = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017';
    await connectToDatabase(mongoUri, 'simciv-test-games');
    
    // Clean up existing data
    await getGamesCollection().deleteMany({});
    await getUsersCollection().deleteMany({});
    await getSessionsCollection().deleteMany({});

    // Create test users
    const user1: User = {
      alias: 'player1',
      publicKey: 'test-public-key',
      accountStatus: 'active',
      createdAt: new Date(),
    };
    await getUsersCollection().insertOne(user1);

    const user2: User = {
      alias: 'player2',
      publicKey: 'test-public-key-2',
      accountStatus: 'active',
      createdAt: new Date(),
    };
    await getUsersCollection().insertOne(user2);

    const user3: User = {
      alias: 'player3',
      publicKey: 'test-public-key-3',
      accountStatus: 'active',
      createdAt: new Date(),
    };
    await getUsersCollection().insertOne(user3);

    // Set up express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(sessionMiddleware);
    app.use('/api/auth', authRoutes);
    app.use('/api/games', gamesRoutes);

    // Create agents that maintain cookies
    agent1 = request.agent(app);
    agent2 = request.agent(app);
    agent3 = request.agent(app);

    // Initialize sessions by making a request (creates session + userId via middleware)
    // We need to manually set the userId after session is created
    await agent1.get('/api/session/status');
    await agent2.get('/api/session/status');
    await agent3.get('/api/session/status');

    // Update sessions to mark as authenticated with user IDs
    const sessions = await getSessionsCollection().find().toArray();
    if (sessions[0]) {
      await getSessionsCollection().updateOne(
        { sessionGuid: sessions[0].sessionGuid },
        { $set: { userId: 'player1', state: 'authenticated' } }
      );
    }
    if (sessions[1]) {
      await getSessionsCollection().updateOne(
        { sessionGuid: sessions[1].sessionGuid },
        { $set: { userId: 'player2', state: 'authenticated' } }
      );
    }
    if (sessions[2]) {
      await getSessionsCollection().updateOne(
        { sessionGuid: sessions[2].sessionGuid },
        { $set: { userId: 'player3', state: 'authenticated' } }
      );
    }
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should create a new game', async () => {
    const response = await agent1
      .post('/api/games')
      .send({ maxPlayers: 2 })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.game).toBeDefined();
    expect(response.body.game.maxPlayers).toBe(2);
    expect(response.body.game.currentPlayers).toBe(1);
    expect(response.body.game.state).toBe('waiting');
  });

  it('should reject game creation without authentication', async () => {
    // Create a new agent without authentication
    const unauthAgent = request.agent(app);
    await unauthAgent.get('/api/session/status'); // Create session but don't authenticate

    const response = await unauthAgent
      .post('/api/games')
      .send({ maxPlayers: 2 })
      .expect(401);

    expect(response.body.error).toBe('Authentication required');
  });

  it('should reject invalid maxPlayers', async () => {
    const invalidValues = [1, 9, 0, -1, 'abc', null];

    for (const maxPlayers of invalidValues) {
      const response = await agent1
        .post('/api/games')
        .send({ maxPlayers })
        .expect(400);

      expect(response.body.error).toContain('maxPlayers');
    }
  });

  it('should list all games', async () => {
    // Create two games
    await agent1
      .post('/api/games')
      .send({ maxPlayers: 2 })
      .expect(201);

    await agent1
      .post('/api/games')
      .send({ maxPlayers: 4 })
      .expect(201);

    // List games
    const response = await agent1
      .get('/api/games')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.games).toHaveLength(2);
  });

  it('should get a specific game', async () => {
    // Create a game
    const createResponse = await agent1
      .post('/api/games')
      .send({ maxPlayers: 2 })
      .expect(201);

    const gameId = createResponse.body.game.gameId;

    // Get the game
    const response = await agent1
      .get(`/api/games/${gameId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.game.gameId).toBe(gameId);
    expect(response.body.game.playerList).toHaveLength(1);
    expect(response.body.game.playerList[0]).toBe('player1');
  });

  it('should allow a second player to join a game', async () => {
    // Create a game with player1
    const createResponse = await agent1
      .post('/api/games')
      .send({ maxPlayers: 2 })
      .expect(201);

    const gameId = createResponse.body.game.gameId;

    // Player2 joins the game
    const joinResponse = await agent2
      .post(`/api/games/${gameId}/join`)
      .expect(200);

    expect(joinResponse.body.success).toBe(true);
    expect(joinResponse.body.game.currentPlayers).toBe(2);
    expect(joinResponse.body.game.state).toBe('started'); // Should auto-start when full
    expect(joinResponse.body.game.startedAt).toBeDefined();
  });

  it('should auto-start game when last player joins', async () => {
    // Create game with maxPlayers: 2
    const createResponse = await agent1
      .post('/api/games')
      .send({ maxPlayers: 2 })
      .expect(201);

    const gameId = createResponse.body.game.gameId;

    // Verify game is waiting
    let gameResponse = await agent1
      .get(`/api/games/${gameId}`)
      .expect(200);

    expect(gameResponse.body.game.state).toBe('waiting');

    // Second player joins
    await agent2
      .post(`/api/games/${gameId}/join`)
      .expect(200);

    // Verify game is started
    gameResponse = await agent1
      .get(`/api/games/${gameId}`)
      .expect(200);

    expect(gameResponse.body.game.state).toBe('started');
    expect(gameResponse.body.game.currentPlayers).toBe(2);
    expect(gameResponse.body.game.startedAt).toBeDefined();
    // lastTickAt should be undefined initially - simulation engine will set it on first tick
    expect(gameResponse.body.game.lastTickAt).toBeUndefined();
  });

  it('should prevent joining a started game', async () => {
    // Create a full game (2 players)
    const createResponse = await agent1
      .post('/api/games')
      .send({ maxPlayers: 2 })
      .expect(201);

    const gameId = createResponse.body.game.gameId;

    // Add second player
    await agent2
      .post(`/api/games/${gameId}/join`)
      .expect(200);

    // Third player tries to join
    const response = await agent3
      .post(`/api/games/${gameId}/join`)
      .expect(400);

    expect(response.body.error).toBe('Game has already started');
  });

  it('should prevent duplicate player in same game', async () => {
    // Create a game
    const createResponse = await agent1
      .post('/api/games')
      .send({ maxPlayers: 4 })
      .expect(201);

    const gameId = createResponse.body.game.gameId;

    // Try to join again with same player
    const response = await agent1
      .post(`/api/games/${gameId}/join`)
      .expect(400);

    expect(response.body.error).toBe('You are already in this game');
  });

  it('should list user\'s games', async () => {
    // Create multiple games
    await agent1
      .post('/api/games')
      .send({ maxPlayers: 2 })
      .expect(201);

    await agent1
      .post('/api/games')
      .send({ maxPlayers: 4 })
      .expect(201);

    // Get user's games
    const response = await agent1
      .get('/api/games/user/my-games')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.games).toHaveLength(2);
    expect(response.body.games[0].creatorUserId).toBe('player1');
  });

  it('should initialize game with correct starting year', async () => {
    const response = await agent1
      .post('/api/games')
      .send({ maxPlayers: 2 })
      .expect(201);

    const gameId = response.body.game.gameId;

    const gameResponse = await agent1
      .get(`/api/games/${gameId}`)
      .expect(200);

    expect(gameResponse.body.game.currentYear).toBe(-5000); // 5000 BC
  });
});
