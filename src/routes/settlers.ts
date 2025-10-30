import { Router, Request, Response } from 'express';
import { getUnitsCollection, getSettlementsCollection } from '../db/connection';

const router = Router();

/**
 * GET /api/game/:gameId/units - Get units for a game
 */
router.get('/:gameId/units', async (req: Request, res: Response): Promise<void> => {
  try {
    const { gameId } = req.params;
    const userId = req.session?.userId;

    // Validate authentication
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Get units for the current player
    const units = await getUnitsCollection()
      .find({ gameId, playerId: userId })
      .toArray();

    res.json({
      success: true,
      units: units.map((unit) => ({
        unitId: unit.unitId,
        unitType: unit.unitType,
        location: unit.location,
        stepsTaken: unit.stepsTaken,
        populationCost: unit.populationCost,
      })),
    });
  } catch (error) {
    console.error('Error getting units:', error);
    res.status(500).json({ error: 'Failed to get units' });
  }
});

/**
 * GET /api/game/:gameId/settlements - Get settlements for a game
 */
router.get('/:gameId/settlements', async (req: Request, res: Response): Promise<void> => {
  try {
    const { gameId } = req.params;
    const userId = req.session?.userId;

    // Validate authentication
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Get settlements for the current player
    const settlements = await getSettlementsCollection()
      .find({ gameId, playerId: userId })
      .toArray();

    res.json({
      success: true,
      settlements: settlements.map((settlement) => ({
        settlementId: settlement.settlementId,
        name: settlement.name,
        type: settlement.type,
        location: settlement.location,
      })),
    });
  } catch (error) {
    console.error('Error getting settlements:', error);
    res.status(500).json({ error: 'Failed to get settlements' });
  }
});

export default router;
