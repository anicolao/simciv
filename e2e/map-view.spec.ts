import { test, expect } from '@playwright/test';
import { MongoClient } from 'mongodb';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'simciv';

test.describe('Map View E2E Tests', () => {
  let mongoClient: MongoClient;

  test.beforeAll(async () => {
    // Connect to MongoDB for test data setup
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
  });

  test.afterAll(async () => {
    if (mongoClient) {
      await mongoClient.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    // Clean up test data before each test
    const db = mongoClient.db(DB_NAME);
    await db.collection('sessions').deleteMany({ sessionGuid: /^test-/ });
    await db.collection('users').deleteMany({ alias: /^testmapuser/ });
    await db.collection('games').deleteMany({ gameId: /^test-map-game/ });
    await db.collection('mapTiles').deleteMany({ gameId: /^test-map-game/ });
    await db.collection('startingPositions').deleteMany({ gameId: /^test-map-game/ });
    await db.collection('mapMetadata').deleteMany({ gameId: /^test-map-game/ });
  });

  test('should display map when game is started', async ({ page, context }) => {
    // Setup: Create user, session, and game with map data
    const db = mongoClient.db(DB_NAME);
    const userId = 'testmapuser1';
    const gameId = 'test-map-game-1';
    
    // Create user
    await db.collection('users').insertOne({
      alias: userId,
      publicKey: 'test-public-key',
      accountStatus: 'active',
      createdAt: new Date(),
    });

    // Create session
    const sessionGuid = 'test-session-map-1';
    await db.collection('sessions').insertOne({
      sessionGuid,
      userId,
      state: 'authenticated',
      createdAt: new Date(),
      lastAccessAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    // Set session cookie
    await context.addCookies([{
      name: 'sessionGuid',
      value: sessionGuid,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);

    // Create started game
    await db.collection('games').insertOne({
      gameId,
      creatorUserId: userId,
      maxPlayers: 2,
      currentPlayers: 2,
      playerList: [userId, 'player2'],
      state: 'started',
      currentYear: -4000,
      createdAt: new Date(),
      startedAt: new Date(),
    });

    // Create map metadata
    await db.collection('mapMetadata').insertOne({
      gameId,
      seed: 'e2e-test-seed',
      width: 80,
      height: 80,
      playerCount: 2,
      seaLevel: 500,
      generatedAt: new Date(),
      generationTimeMs: 50,
    });

    // Create map tiles (small 10x10 region for testing)
    const tiles: any[] = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        tiles.push({
          gameId,
          x,
          y,
          elevation: 600,
          terrainType: x < 5 ? 'GRASSLAND' : 'FOREST',
          climateZone: 'TEMPERATE',
          hasRiver: x === 5 && y < 5,
          isCoastal: false,
          resources: x === 3 && y === 3 ? ['WHEAT'] : [],
          improvements: [],
          visibleTo: [userId],
          createdAt: new Date(),
        });
      }
    }
    await db.collection('mapTiles').insertMany(tiles);

    // Create starting position
    await db.collection('startingPositions').insertOne({
      gameId,
      playerId: userId,
      centerX: 5,
      centerY: 5,
      startingCityX: 5,
      startingCityY: 5,
      regionScore: 100,
      revealedTiles: 100,
      guaranteedFootprint: {
        minX: 0,
        maxX: 10,
        minY: 0,
        maxY: 10,
      },
      createdAt: new Date(),
    });

    // Navigate to game lobby
    await page.goto(BASE_URL);
    
    // Click on the started game to view details
    await page.click(`text=View`);
    
    // Wait for game details modal to appear
    await page.waitForSelector('.game-details');
    
    // Verify map section is visible
    const mapSection = await page.locator('.map-section');
    await expect(mapSection).toBeVisible();
    
    // Verify map view component is rendered
    const mapView = await page.locator('.map-view');
    await expect(mapView).toBeVisible();
    
    // Take screenshot showing game details with map section
    await page.screenshot({ path: 'e2e-screenshots/19-map-section-visible.png' });
    
    // Verify map grid is displayed
    const mapGrid = await page.locator('.map-grid');
    await expect(mapGrid).toBeVisible();
    
    // Verify map tiles are rendered
    const mapTiles = await page.locator('.map-tile');
    const tileCount = await mapTiles.count();
    expect(tileCount).toBeGreaterThan(0);
    
    // Verify legend is displayed
    const legend = await page.locator('.legend');
    await expect(legend).toBeVisible();
    
    // Verify legend has terrain types
    const legendItems = await page.locator('.legend-item');
    const legendCount = await legendItems.count();
    expect(legendCount).toBeGreaterThan(0);
    
    // Take final screenshot showing the complete map with tiles and legend
    await page.screenshot({ path: 'e2e-screenshots/20-map-view-complete.png', fullPage: true });
  });

  test('should show starting city marker on map', async ({ page, context }) => {
    // Setup similar to previous test
    const db = mongoClient.db(DB_NAME);
    const userId = 'testmapuser2';
    const gameId = 'test-map-game-2';
    
    await db.collection('users').insertOne({
      alias: userId,
      publicKey: 'test-public-key',
      accountStatus: 'active',
      createdAt: new Date(),
    });

    const sessionGuid = 'test-session-map-2';
    await db.collection('sessions').insertOne({
      sessionGuid,
      userId,
      state: 'authenticated',
      createdAt: new Date(),
      lastAccessAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    await context.addCookies([{
      name: 'sessionGuid',
      value: sessionGuid,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);

    await db.collection('games').insertOne({
      gameId,
      creatorUserId: userId,
      maxPlayers: 2,
      currentPlayers: 2,
      playerList: [userId, 'player2'],
      state: 'started',
      currentYear: -4000,
      createdAt: new Date(),
      startedAt: new Date(),
    });

    await db.collection('mapMetadata').insertOne({
      gameId,
      seed: 'e2e-test-seed-2',
      width: 80,
      height: 80,
      playerCount: 2,
      seaLevel: 500,
      generatedAt: new Date(),
      generationTimeMs: 50,
    });

    // Create tiles centered around starting position
    const tiles: any[] = [];
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        tiles.push({
          gameId,
          x,
          y,
          elevation: 600,
          terrainType: 'GRASSLAND',
          climateZone: 'TEMPERATE',
          hasRiver: false,
          isCoastal: false,
          resources: [],
          improvements: [],
          visibleTo: [userId],
          createdAt: new Date(),
        });
      }
    }
    await db.collection('mapTiles').insertMany(tiles);

    // Starting position at center
    await db.collection('startingPositions').insertOne({
      gameId,
      playerId: userId,
      centerX: 10,
      centerY: 10,
      startingCityX: 10,
      startingCityY: 10,
      regionScore: 120,
      revealedTiles: 400,
      guaranteedFootprint: {
        minX: 0,
        maxX: 20,
        minY: 0,
        maxY: 20,
      },
      createdAt: new Date(),
    });

    await page.goto(BASE_URL);
    await page.click(`text=View`);
    await page.waitForSelector('.game-details');
    
    // Wait for map to render
    await page.waitForSelector('.map-section');
    
    // Verify starting city marker is displayed
    const cityMarker = await page.locator('.city-marker');
    await expect(cityMarker).toBeVisible();
    
    // Verify the marker contains a star
    const markerText = await cityMarker.textContent();
    expect(markerText).toContain('⭐');
    
    // Take screenshot highlighting the starting city marker
    await page.screenshot({ path: 'e2e-screenshots/21-map-starting-city-marker.png' });
  });

  test('should show resource markers on tiles with resources', async ({ page, context }) => {
    const db = mongoClient.db(DB_NAME);
    const userId = 'testmapuser3';
    const gameId = 'test-map-game-3';
    
    await db.collection('users').insertOne({
      alias: userId,
      publicKey: 'test-public-key',
      accountStatus: 'active',
      createdAt: new Date(),
    });

    const sessionGuid = 'test-session-map-3';
    await db.collection('sessions').insertOne({
      sessionGuid,
      userId,
      state: 'authenticated',
      createdAt: new Date(),
      lastAccessAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    await context.addCookies([{
      name: 'sessionGuid',
      value: sessionGuid,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);

    await db.collection('games').insertOne({
      gameId,
      creatorUserId: userId,
      maxPlayers: 2,
      currentPlayers: 2,
      playerList: [userId, 'player2'],
      state: 'started',
      currentYear: -4000,
      createdAt: new Date(),
      startedAt: new Date(),
    });

    await db.collection('mapMetadata').insertOne({
      gameId,
      seed: 'e2e-test-seed-3',
      width: 80,
      height: 80,
      playerCount: 2,
      seaLevel: 500,
      generatedAt: new Date(),
      generationTimeMs: 50,
    });

    // Create tiles with resources
    const tiles: any[] = [];
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        const resources = [];
        // Add IRON resource at specific location
        if (x === 5 && y === 5) {
          resources.push('IRON');
        }
        // Add WHEAT resource at another location
        if (x === 8 && y === 8) {
          resources.push('WHEAT');
        }
        
        tiles.push({
          gameId,
          x,
          y,
          elevation: 600,
          terrainType: 'GRASSLAND',
          climateZone: 'TEMPERATE',
          hasRiver: false,
          isCoastal: false,
          resources,
          improvements: [],
          visibleTo: [userId],
          createdAt: new Date(),
        });
      }
    }
    await db.collection('mapTiles').insertMany(tiles);

    await db.collection('startingPositions').insertOne({
      gameId,
      playerId: userId,
      centerX: 10,
      centerY: 10,
      startingCityX: 10,
      startingCityY: 10,
      regionScore: 120,
      revealedTiles: 400,
      guaranteedFootprint: {
        minX: 0,
        maxX: 20,
        minY: 0,
        maxY: 20,
      },
      createdAt: new Date(),
    });

    await page.goto(BASE_URL);
    await page.click(`text=View`);
    await page.waitForSelector('.game-details');
    
    // Wait for map to render
    await page.waitForSelector('.map-section');
    
    // Verify resource markers are displayed
    const resourceMarkers = await page.locator('.resource-marker');
    const markerCount = await resourceMarkers.count();
    expect(markerCount).toBeGreaterThan(0);
    
    // Verify resource markers show first letter of resource
    const firstMarker = resourceMarkers.first();
    const markerText = await firstMarker.textContent();
    expect(markerText).toMatch(/[A-Z]/); // Should contain a capital letter
    
    // Take screenshot showing resource markers on map tiles
    await page.screenshot({ path: 'e2e-screenshots/22-map-resource-markers.png' });
  });

  test('should not show map for waiting games', async ({ page, context }) => {
    const db = mongoClient.db(DB_NAME);
    const userId = 'testmapuser4';
    const gameId = 'test-map-game-4';
    
    await db.collection('users').insertOne({
      alias: userId,
      publicKey: 'test-public-key',
      accountStatus: 'active',
      createdAt: new Date(),
    });

    const sessionGuid = 'test-session-map-4';
    await db.collection('sessions').insertOne({
      sessionGuid,
      userId,
      state: 'authenticated',
      createdAt: new Date(),
      lastAccessAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    await context.addCookies([{
      name: 'sessionGuid',
      value: sessionGuid,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);

    // Create waiting game (not started yet)
    await db.collection('games').insertOne({
      gameId,
      creatorUserId: userId,
      maxPlayers: 4,
      currentPlayers: 1,
      playerList: [userId],
      state: 'waiting',
      currentYear: -4000,
      createdAt: new Date(),
    });

    await page.goto(BASE_URL);
    await page.click(`text=View`);
    await page.waitForSelector('.game-details');
    
    // Verify map section is NOT visible for waiting games
    const mapSection = await page.locator('.map-section');
    await expect(mapSection).not.toBeVisible();
    
    // Take screenshot showing game details without map section for waiting game
    await page.screenshot({ path: 'e2e-screenshots/23-game-waiting-no-map.png' });
  });
});
