import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { connectToDatabase, closeDatabase, getGamesCollection, getUsersCollection, getSessionsCollection, getMapTilesCollection, getStartingPositionsCollection, getMapMetadataCollection } from '../../db/connection';
import { Game, User, Session, MapTile, StartingPosition, MapMetadata } from '../../models/types';
import { sessionMiddleware } from '../../middleware/session';
import mapRoutes from '../../routes/map';

describe('Map API Integration Tests', () => {
  let app: express.Application;
  let testSessionGuid: string;
  let testUserId: string;
  let testGameId: string;

  beforeEach(async () => {
    // Close any existing connection first
    await closeDatabase();
    
    // Always use external MongoDB for testing
    const mongoUri = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017';
    await connectToDatabase(mongoUri, 'simciv-test-map');
    
    // Clean up existing data
    await getGamesCollection().deleteMany({});
    await getUsersCollection().deleteMany({});
    await getSessionsCollection().deleteMany({});
    await getMapTilesCollection().deleteMany({});
    await getStartingPositionsCollection().deleteMany({});
    await getMapMetadataCollection().deleteMany({});

    // Create test user
    testUserId = 'testuser';
    const user: User = {
      alias: testUserId,
      publicKey: 'test-public-key',
      accountStatus: 'active',
      createdAt: new Date(),
    };
    await getUsersCollection().insertOne(user);

    // Create test session with valid UUID format
    testSessionGuid = '12345678-1234-4123-8123-123456789abc';
    const session: Session = {
      sessionGuid: testSessionGuid,
      userId: testUserId,
      state: 'authenticated',
      createdAt: new Date(),
      lastAccessAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    };
    await getSessionsCollection().insertOne(session);

    // Create test game
    testGameId = 'test-game-123';
    const game: Game = {
      gameId: testGameId,
      creatorUserId: testUserId,
      maxPlayers: 4,
      currentPlayers: 1,
      playerList: [testUserId],
      state: 'started',
      currentYear: -4000,
      createdAt: new Date(),
      startedAt: new Date(),
    };
    await getGamesCollection().insertOne(game);

    // Create test map data
    const metadata: MapMetadata = {
      gameId: testGameId,
      seed: 'test-seed',
      width: 80,
      height: 80,
      playerCount: 4,
      seaLevel: 500,
      generatedAt: new Date(),
      generationTimeMs: 100,
    };
    await getMapMetadataCollection().insertOne(metadata);

    // Create some test tiles
    const tiles: MapTile[] = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        tiles.push({
          gameId: testGameId,
          x,
          y,
          elevation: 600,
          terrainType: 'GRASSLAND',
          climateZone: 'TEMPERATE',
          hasRiver: false,
          isCoastal: false,
          resources: [],
          improvements: [],
          visibleTo: [testUserId],
          createdAt: new Date(),
        });
      }
    }
    await getMapTilesCollection().insertMany(tiles);

    // Create starting position
    const startingPosition: StartingPosition = {
      gameId: testGameId,
      playerId: testUserId,
      centerX: 40,
      centerY: 40,
      startingCityX: 40,
      startingCityY: 40,
      regionScore: 100,
      revealedTiles: 225,
      guaranteedFootprint: {
        minX: 20,
        maxX: 60,
        minY: 20,
        maxY: 60,
      },
      createdAt: new Date(),
    };
    await getStartingPositionsCollection().insertOne(startingPosition);

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(sessionMiddleware);
    app.use('/api/map', mapRoutes);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  describe('GET /api/map/:gameId/metadata', () => {
    it('should return map metadata for authenticated user', async () => {
      const response = await request(app)
        .get(`/api/map/${testGameId}/metadata`)
        .set('Cookie', [`simciv_session=${testSessionGuid}`]);

      expect(response.status).toBe(200);
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.gameId).toBe(testGameId);
      expect(response.body.metadata.width).toBe(80);
      expect(response.body.metadata.height).toBe(80);
      expect(response.body.metadata.seed).toBe('test-seed');
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app)
        .get(`/api/map/${testGameId}/metadata`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent game', async () => {
      const response = await request(app)
        .get('/api/map/non-existent-game/metadata')
        .set('Cookie', [`simciv_session=${testSessionGuid}`]);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/map/:gameId/tiles', () => {
    it('should return ALL tiles for authenticated user (no fog of war on server)', async () => {
      const response = await request(app)
        .get(`/api/map/${testGameId}/tiles`)
        .set('Cookie', [`simciv_session=${testSessionGuid}`]);

      expect(response.status).toBe(200);
      expect(response.body.tiles).toBeDefined();
      expect(Array.isArray(response.body.tiles)).toBe(true);
      expect(response.body.tiles.length).toBe(100); // 10x10 tiles we created - ALL tiles, not just visible ones
      
      // Check tile properties
      const firstTile = response.body.tiles[0];
      expect(firstTile.gameId).toBe(testGameId);
      expect(firstTile.terrainType).toBe('GRASSLAND');
      // Tiles should have visibleTo property but server doesn't filter by it
      expect(firstTile.visibleTo).toBeDefined();
    });

    it('should return tiles with valid terrain data (not blank/invisible)', async () => {
      const response = await request(app)
        .get(`/api/map/${testGameId}/tiles`)
        .set('Cookie', [`simciv_session=${testSessionGuid}`]);

      expect(response.status).toBe(200);
      expect(response.body.tiles.length).toBe(100);

      // Log first few tiles to verify content
      console.log('\n=== Tile Data Verification ===');
      console.log(`Total tiles returned: ${response.body.tiles.length}`);
      console.log('\nFirst 5 tiles:');
      response.body.tiles.slice(0, 5).forEach((tile: any, idx: number) => {
        console.log(`  Tile ${idx}: (${tile.x},${tile.y}) terrainType=${tile.terrainType} elevation=${tile.elevation} visibleTo=${JSON.stringify(tile.visibleTo)}`);
      });

      // Verify all tiles have valid terrain types
      const validTerrainTypes = [
        'OCEAN', 'SHALLOW_WATER', 'MOUNTAIN', 'HILLS', 
        'GRASSLAND', 'PLAINS', 'FOREST', 'JUNGLE', 
        'DESERT', 'TUNDRA', 'ICE'
      ];
      
      response.body.tiles.forEach((tile: any) => {
        expect(tile.terrainType).toBeDefined();
        expect(validTerrainTypes).toContain(tile.terrainType);
        expect(tile.elevation).toBeDefined();
        expect(typeof tile.elevation).toBe('number');
        expect(tile.x).toBeDefined();
        expect(tile.y).toBeDefined();
      });

      // Count terrain type distribution
      const terrainCounts: Record<string, number> = {};
      response.body.tiles.forEach((tile: any) => {
        terrainCounts[tile.terrainType] = (terrainCounts[tile.terrainType] || 0) + 1;
      });
      console.log('\nTerrain type distribution:');
      Object.entries(terrainCounts).forEach(([terrain, count]) => {
        console.log(`  ${terrain}: ${count} tiles`);
      });
      
      // Check if tiles have coordinates that would be visible in a viewport
      const tilesInViewport = response.body.tiles.filter((tile: any) => 
        tile.x >= 0 && tile.x < 20 && tile.y >= 0 && tile.y < 15
      );
      console.log(`\nTiles in viewport (0-20, 0-15): ${tilesInViewport.length}/100`);
      console.log('=== End Tile Data Verification ===\n');
      
      // Ensure we have tiles that would be visible in a typical viewport
      expect(tilesInViewport.length).toBeGreaterThan(0);
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app)
        .get(`/api/map/${testGameId}/tiles`);

      expect(response.status).toBe(401);
    });

    it('should return all tiles even for users not in visibleTo list (no server-side fog of war)', async () => {
      // Create another user with no visible tiles in the visibleTo array
      const otherUserId = 'otheruser';
      const otherSessionGuid = '22345678-2234-4223-8223-223456789abc';
      
      await getUsersCollection().insertOne({
        alias: otherUserId,
        publicKey: 'other-public-key',
        accountStatus: 'active',
        createdAt: new Date(),
      });
      
      await getSessionsCollection().insertOne({
        sessionGuid: otherSessionGuid,
        userId: otherUserId,
        state: 'authenticated',
        createdAt: new Date(),
        lastAccessAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      });

      const response = await request(app)
        .get(`/api/map/${testGameId}/tiles`)
        .set('Cookie', [`simciv_session=${otherSessionGuid}`]);

      expect(response.status).toBe(200);
      expect(response.body.tiles).toBeDefined();
      // Server returns ALL tiles, not filtered by visibleTo
      expect(response.body.tiles.length).toBe(100);
    });
  });

  describe('GET /api/map/:gameId/starting-position', () => {
    it('should return starting position for authenticated user', async () => {
      const response = await request(app)
        .get(`/api/map/${testGameId}/starting-position`)
        .set('Cookie', [`simciv_session=${testSessionGuid}`]);

      expect(response.status).toBe(200);
      expect(response.body.position).toBeDefined();
      expect(response.body.position.gameId).toBe(testGameId);
      expect(response.body.position.playerId).toBe(testUserId);
      expect(response.body.position.centerX).toBe(40);
      expect(response.body.position.centerY).toBe(40);
      expect(response.body.position.regionScore).toBe(100);
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app)
        .get(`/api/map/${testGameId}/starting-position`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for user with no starting position', async () => {
      // Create another user with no starting position
      const otherUserId = 'otheruser2';
      const otherSessionGuid = '32345678-3234-4323-8323-323456789abc';
      
      await getUsersCollection().insertOne({
        alias: otherUserId,
        publicKey: 'other-public-key',
        accountStatus: 'active',
        createdAt: new Date(),
      });
      
      await getSessionsCollection().insertOne({
        sessionGuid: otherSessionGuid,
        userId: otherUserId,
        state: 'authenticated',
        createdAt: new Date(),
        lastAccessAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      });

      const response = await request(app)
        .get(`/api/map/${testGameId}/starting-position`)
        .set('Cookie', [`simciv_session=${otherSessionGuid}`]);

      expect(response.status).toBe(404);
    });
  });
});
