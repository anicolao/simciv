import { Router, Request, Response } from 'express';
import { getGamesCollection } from '../db/connection';
import { Game } from '../models/types';
import crypto from 'crypto';
import { generateUuid } from '../utils/crypto';

const router = Router();

/**
 * POST /api/games - Create a new game
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { maxPlayers } = req.body;
    const userId = req.session?.userId;

    // Validate authentication
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Validate maxPlayers
    if (!maxPlayers || typeof maxPlayers !== 'number' || maxPlayers < 2 || maxPlayers > 8) {
      res.status(400).json({ error: 'maxPlayers must be a number between 2 and 8' });
      return;
    }

    // Create game
    const gameId = generateUuid('game');
    const game: Game = {
      gameId,
      creatorUserId: userId,
      maxPlayers,
      currentPlayers: 1,
      playerList: [userId],
      state: 'waiting',
      currentYear: -5000, // 5000 BC
      createdAt: new Date(),
    };

    await getGamesCollection().insertOne(game);

    res.status(201).json({
      success: true,
      game: {
        gameId: game.gameId,
        maxPlayers: game.maxPlayers,
        currentPlayers: game.currentPlayers,
        state: game.state,
        createdAt: game.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

/**
 * GET /api/games - List all games
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const games = await getGamesCollection()
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      games: games.map((game) => ({
        gameId: game.gameId,
        creatorUserId: game.creatorUserId,
        maxPlayers: game.maxPlayers,
        currentPlayers: game.currentPlayers,
        state: game.state,
        currentYear: game.currentYear,
        createdAt: game.createdAt,
        startedAt: game.startedAt,
      })),
    });
  } catch (error) {
    console.error('Error listing games:', error);
    res.status(500).json({ error: 'Failed to list games' });
  }
});

/**
 * GET /api/games/:gameId - Get specific game
 */
router.get('/:gameId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { gameId } = req.params;

    const game = await getGamesCollection().findOne({ gameId });

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    res.json({
      success: true,
      game: {
        gameId: game.gameId,
        creatorUserId: game.creatorUserId,
        maxPlayers: game.maxPlayers,
        currentPlayers: game.currentPlayers,
        playerList: game.playerList,
        state: game.state,
        currentYear: game.currentYear,
        createdAt: game.createdAt,
        startedAt: game.startedAt,
        lastTickAt: game.lastTickAt,
      },
    });
  } catch (error) {
    console.error('Error getting game:', error);
    res.status(500).json({ error: 'Failed to get game' });
  }
});

/**
 * POST /api/games/:gameId/join - Join a game
 */
router.post('/:gameId/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { gameId } = req.params;
    const userId = req.session?.userId;

    // Validate authentication
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const gamesCollection = getGamesCollection();

    // Get current game state
    const game = await gamesCollection.findOne({ gameId });

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    // Validate join eligibility
    if (game.state !== 'waiting') {
      res.status(400).json({ error: 'Game has already started' });
      return;
    }

    if (game.playerList.includes(userId)) {
      res.status(400).json({ error: 'You are already in this game' });
      return;
    }

    if (game.currentPlayers >= game.maxPlayers) {
      res.status(400).json({ error: 'Game is full' });
      return;
    }

    // Add player to game
    const newPlayerCount = game.currentPlayers + 1;
    const update: Partial<Game> = {
      currentPlayers: newPlayerCount,
      playerList: [...game.playerList, userId],
    };

    // If game is now full, start it
    if (newPlayerCount >= game.maxPlayers) {
      update.state = 'started';
      update.startedAt = new Date();
      // Don't set lastTickAt - let it remain undefined so simulation engine
      // recognizes this as a new game and generates the map
    }

    const result = await gamesCollection.updateOne(
      { gameId, currentPlayers: game.currentPlayers }, // Optimistic locking
      { $set: update }
    );

    if (result.matchedCount === 0) {
      res.status(409).json({ error: 'Game state changed, please try again' });
      return;
    }

    // Get updated game
    const updatedGame = await gamesCollection.findOne({ gameId });

    res.json({
      success: true,
      game: {
        gameId: updatedGame!.gameId,
        currentPlayers: updatedGame!.currentPlayers,
        maxPlayers: updatedGame!.maxPlayers,
        state: updatedGame!.state,
        startedAt: updatedGame!.startedAt,
      },
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

/**
 * GET /api/games/my-games - Get current user's games
 */
router.get('/user/my-games', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const games = await getGamesCollection()
      .find({ playerList: userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      games: games.map((game) => ({
        gameId: game.gameId,
        creatorUserId: game.creatorUserId,
        maxPlayers: game.maxPlayers,
        currentPlayers: game.currentPlayers,
        state: game.state,
        currentYear: game.currentYear,
        createdAt: game.createdAt,
        startedAt: game.startedAt,
      })),
    });
  } catch (error) {
    console.error('Error getting user games:', error);
    res.status(500).json({ error: 'Failed to get user games' });
  }
});

export default router;
