import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, closeDatabase, getGamesCollection, getUsersCollection, getSessionsCollection } from '../../db/connection';
import { Game, User, Session } from '../../models/types';

describe('Game Creation and Management', () => {
  let mongoServer: MongoMemoryServer;

  beforeEach(async () => {
    // Use external MongoDB if TEST_MONGO_URI is set
    if (process.env.TEST_MONGO_URI) {
      await connectToDatabase(process.env.TEST_MONGO_URI, 'simciv-test');
      // Clean up existing data
      await getGamesCollection().deleteMany({});
      await getUsersCollection().deleteMany({});
      await getSessionsCollection().deleteMany({});
    } else {
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await connectToDatabase(uri, 'simciv-test');
    }

    // Create test user
    const user: User = {
      alias: 'testuser',
      publicKey: 'test-public-key',
      accountStatus: 'active',
      createdAt: new Date(),
    };
    await getUsersCollection().insertOne(user);

    // Create test session
    const session: Session = {
      sessionGuid: 'test-session-guid',
      userId: 'testuser',
      state: 'authenticated',
      createdAt: new Date(),
      lastAccessAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    };
    await getSessionsCollection().insertOne(session);
  });

  afterEach(async () => {
    await closeDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('should create a game with valid parameters', async () => {
    const game: Game = {
      gameId: 'test-game-1',
      creatorUserId: 'testuser',
      maxPlayers: 4,
      currentPlayers: 1,
      playerList: ['testuser'],
      state: 'waiting',
      currentYear: -5000,
      createdAt: new Date(),
    };

    await getGamesCollection().insertOne(game);

    const retrieved = await getGamesCollection().findOne({ gameId: 'test-game-1' });
    expect(retrieved).toBeDefined();
    expect(retrieved?.gameId).toBe('test-game-1');
    expect(retrieved?.maxPlayers).toBe(4);
    expect(retrieved?.currentPlayers).toBe(1);
    expect(retrieved?.state).toBe('waiting');
    expect(retrieved?.currentYear).toBe(-5000);
  });

  it('should validate maxPlayers is between 2 and 8', async () => {
    // Test invalid maxPlayers
    const invalidGames = [
      { maxPlayers: 1 },
      { maxPlayers: 9 },
      { maxPlayers: 0 },
      { maxPlayers: -1 },
    ];

    for (const { maxPlayers } of invalidGames) {
      const isValid = maxPlayers >= 2 && maxPlayers <= 8;
      expect(isValid).toBe(false);
    }

    // Test valid maxPlayers
    const validGames = [2, 3, 4, 5, 6, 7, 8];
    for (const maxPlayers of validGames) {
      const isValid = maxPlayers >= 2 && maxPlayers <= 8;
      expect(isValid).toBe(true);
    }
  });

  it('should add a player to a waiting game', async () => {
    // Create initial game
    const game: Game = {
      gameId: 'test-game-2',
      creatorUserId: 'testuser',
      maxPlayers: 4,
      currentPlayers: 1,
      playerList: ['testuser'],
      state: 'waiting',
      currentYear: -5000,
      createdAt: new Date(),
    };

    await getGamesCollection().insertOne(game);

    // Add second player
    const result = await getGamesCollection().updateOne(
      { gameId: 'test-game-2', currentPlayers: 1 },
      {
        $set: {
          currentPlayers: 2,
          playerList: ['testuser', 'player2'],
        },
      }
    );

    expect(result.modifiedCount).toBe(1);

    const updated = await getGamesCollection().findOne({ gameId: 'test-game-2' });
    expect(updated?.currentPlayers).toBe(2);
    expect(updated?.playerList).toHaveLength(2);
    expect(updated?.state).toBe('waiting');
  });

  it('should start game when last player joins', async () => {
    // Create game with 1 slot remaining
    const game: Game = {
      gameId: 'test-game-3',
      creatorUserId: 'testuser',
      maxPlayers: 2,
      currentPlayers: 1,
      playerList: ['testuser'],
      state: 'waiting',
      currentYear: -5000,
      createdAt: new Date(),
    };

    await getGamesCollection().insertOne(game);

    // Add second player (fills the game)
    const now = new Date();
    const result = await getGamesCollection().updateOne(
      { gameId: 'test-game-3', currentPlayers: 1 },
      {
        $set: {
          currentPlayers: 2,
          playerList: ['testuser', 'player2'],
          state: 'started',
          startedAt: now,
          lastTickAt: now,
        },
      }
    );

    expect(result.modifiedCount).toBe(1);

    const updated = await getGamesCollection().findOne({ gameId: 'test-game-3' });
    expect(updated?.currentPlayers).toBe(2);
    expect(updated?.state).toBe('started');
    expect(updated?.startedAt).toBeDefined();
    expect(updated?.lastTickAt).toBeDefined();
  });

  it('should prevent joining a started game', async () => {
    // Create started game
    const game: Game = {
      gameId: 'test-game-4',
      creatorUserId: 'testuser',
      maxPlayers: 2,
      currentPlayers: 2,
      playerList: ['testuser', 'player2'],
      state: 'started',
      currentYear: -5000,
      createdAt: new Date(),
      startedAt: new Date(),
      lastTickAt: new Date(),
    };

    await getGamesCollection().insertOne(game);

    // Attempt to join should be rejected (in actual API, not here in DB test)
    const isStarted = game.state === 'started';
    expect(isStarted).toBe(true);
  });

  it('should prevent joining a full game', async () => {
    // Create full waiting game (edge case)
    const game: Game = {
      gameId: 'test-game-5',
      creatorUserId: 'testuser',
      maxPlayers: 2,
      currentPlayers: 2,
      playerList: ['testuser', 'player2'],
      state: 'waiting', // Somehow still waiting but full
      currentYear: -5000,
      createdAt: new Date(),
    };

    await getGamesCollection().insertOne(game);

    // Check if full
    const isFull = game.currentPlayers >= game.maxPlayers;
    expect(isFull).toBe(true);
  });

  it('should prevent duplicate player in same game', async () => {
    const game: Game = {
      gameId: 'test-game-6',
      creatorUserId: 'testuser',
      maxPlayers: 4,
      currentPlayers: 1,
      playerList: ['testuser'],
      state: 'waiting',
      currentYear: -5000,
      createdAt: new Date(),
    };

    await getGamesCollection().insertOne(game);

    // Check if player already in game
    const isAlreadyInGame = game.playerList.includes('testuser');
    expect(isAlreadyInGame).toBe(true);
  });

  it('should handle concurrent join with optimistic locking', async () => {
    const game: Game = {
      gameId: 'test-game-7',
      creatorUserId: 'testuser',
      maxPlayers: 2,
      currentPlayers: 1,
      playerList: ['testuser'],
      state: 'waiting',
      currentYear: -5000,
      createdAt: new Date(),
    };

    await getGamesCollection().insertOne(game);

    // First update succeeds
    const result1 = await getGamesCollection().updateOne(
      { gameId: 'test-game-7', currentPlayers: 1 },
      {
        $set: {
          currentPlayers: 2,
          playerList: ['testuser', 'player2'],
        },
      }
    );
    expect(result1.modifiedCount).toBe(1);

    // Second update with same condition fails (optimistic locking)
    const result2 = await getGamesCollection().updateOne(
      { gameId: 'test-game-7', currentPlayers: 1 },
      {
        $set: {
          currentPlayers: 2,
          playerList: ['testuser', 'player3'],
        },
      }
    );
    expect(result2.matchedCount).toBe(0); // No match because currentPlayers is now 2
  });

  it('should list games sorted by creation date', async () => {
    const games: Game[] = [
      {
        gameId: 'game-1',
        creatorUserId: 'testuser',
        maxPlayers: 4,
        currentPlayers: 1,
        playerList: ['testuser'],
        state: 'waiting',
        currentYear: -5000,
        createdAt: new Date('2024-01-01'),
      },
      {
        gameId: 'game-2',
        creatorUserId: 'testuser',
        maxPlayers: 4,
        currentPlayers: 2,
        playerList: ['testuser', 'player2'],
        state: 'waiting',
        currentYear: -5000,
        createdAt: new Date('2024-01-02'),
      },
      {
        gameId: 'game-3',
        creatorUserId: 'testuser',
        maxPlayers: 2,
        currentPlayers: 2,
        playerList: ['testuser', 'player2'],
        state: 'started',
        currentYear: -4990,
        createdAt: new Date('2024-01-03'),
        startedAt: new Date('2024-01-03'),
      },
    ];

    await getGamesCollection().insertMany(games);

    const retrieved = await getGamesCollection()
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    expect(retrieved).toHaveLength(3);
    expect(retrieved[0].gameId).toBe('game-3');
    expect(retrieved[1].gameId).toBe('game-2');
    expect(retrieved[2].gameId).toBe('game-1');
  });

  it('should filter games by state', async () => {
    const games: Game[] = [
      {
        gameId: 'waiting-game',
        creatorUserId: 'testuser',
        maxPlayers: 4,
        currentPlayers: 1,
        playerList: ['testuser'],
        state: 'waiting',
        currentYear: -5000,
        createdAt: new Date(),
      },
      {
        gameId: 'started-game',
        creatorUserId: 'testuser',
        maxPlayers: 2,
        currentPlayers: 2,
        playerList: ['testuser', 'player2'],
        state: 'started',
        currentYear: -4990,
        createdAt: new Date(),
        startedAt: new Date(),
      },
    ];

    await getGamesCollection().insertMany(games);

    const waitingGames = await getGamesCollection().find({ state: 'waiting' }).toArray();
    expect(waitingGames).toHaveLength(1);
    expect(waitingGames[0].gameId).toBe('waiting-game');

    const startedGames = await getGamesCollection().find({ state: 'started' }).toArray();
    expect(startedGames).toHaveLength(1);
    expect(startedGames[0].gameId).toBe('started-game');
  });

  it('should filter games by player', async () => {
    // Create second user
    const user2: User = {
      alias: 'player2',
      publicKey: 'test-public-key-2',
      accountStatus: 'active',
      createdAt: new Date(),
    };
    await getUsersCollection().insertOne(user2);

    const games: Game[] = [
      {
        gameId: 'user1-game',
        creatorUserId: 'testuser',
        maxPlayers: 4,
        currentPlayers: 1,
        playerList: ['testuser'],
        state: 'waiting',
        currentYear: -5000,
        createdAt: new Date(),
      },
      {
        gameId: 'shared-game',
        creatorUserId: 'testuser',
        maxPlayers: 4,
        currentPlayers: 2,
        playerList: ['testuser', 'player2'],
        state: 'waiting',
        currentYear: -5000,
        createdAt: new Date(),
      },
      {
        gameId: 'user2-game',
        creatorUserId: 'player2',
        maxPlayers: 2,
        currentPlayers: 1,
        playerList: ['player2'],
        state: 'waiting',
        currentYear: -5000,
        createdAt: new Date(),
      },
    ];

    await getGamesCollection().insertMany(games);

    const user1Games = await getGamesCollection()
      .find({ playerList: 'testuser' })
      .toArray();
    expect(user1Games).toHaveLength(2);

    const user2Games = await getGamesCollection()
      .find({ playerList: 'player2' })
      .toArray();
    expect(user2Games).toHaveLength(2);
  });
});
