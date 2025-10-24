import { Router, Request, Response } from 'express';
import { getMapTilesCollection, getStartingPositionsCollection, getMapMetadataCollection } from '../db/connection';

const router = Router();

// Get map metadata for a game
router.get('/:gameId/metadata', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const userId = (req as any).session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const metadata = await getMapMetadataCollection().findOne({ gameId });
    
    if (!metadata) {
      return res.status(404).json({ error: 'Map not found' });
    }

    res.json({ metadata });
  } catch (error) {
    console.error('Error fetching map metadata:', error);
    res.status(500).json({ error: 'Failed to fetch map metadata' });
  }
});

// Get map tiles for a game (no server-side fog of war)
router.get('/:gameId/tiles', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const userId = (req as any).session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Return ALL tiles for the game - no server-side fog of war
    // Client will handle visibility/fog of war if needed
    const tiles = await getMapTilesCollection()
      .find({ gameId })
      .toArray();

    res.json({ tiles });
  } catch (error) {
    console.error('Error fetching map tiles:', error);
    res.status(500).json({ error: 'Failed to fetch map tiles' });
  }
});

// Get all tiles (no visibility filter) - for debugging/admin
router.get('/:gameId/tiles/all', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const userId = (req as any).session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const tiles = await getMapTilesCollection()
      .find({ gameId })
      .toArray();

    res.json({ tiles });
  } catch (error) {
    console.error('Error fetching all map tiles:', error);
    res.status(500).json({ error: 'Failed to fetch all map tiles' });
  }
});

// Get player's starting position
router.get('/:gameId/starting-position', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const userId = (req as any).session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const position = await getStartingPositionsCollection().findOne({
      gameId,
      playerId: userId
    });

    if (!position) {
      return res.status(404).json({ error: 'Starting position not found' });
    }

    res.json({ position });
  } catch (error) {
    console.error('Error fetching starting position:', error);
    res.status(500).json({ error: 'Failed to fetch starting position' });
  }
});

export default router;
