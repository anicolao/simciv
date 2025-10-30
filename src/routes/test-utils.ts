import { Router, Request, Response } from 'express';
import { resetDeterministicUuidCounter } from '../utils/crypto';

const router = Router();

/**
 * POST /api/test/reset-uuid-counter - Reset deterministic UUID counter for E2E tests
 * Only available when E2E_TEST_MODE is enabled
 */
router.post('/reset-uuid-counter', async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow in E2E test mode
    if (process.env.E2E_TEST_MODE !== '1') {
      res.status(403).json({ error: 'Test utilities not available in this environment' });
      return;
    }

    resetDeterministicUuidCounter();
    
    res.json({
      success: true,
      message: 'UUID counter reset successfully'
    });
  } catch (error) {
    console.error('Error resetting UUID counter:', error);
    res.status(500).json({ error: 'Failed to reset UUID counter' });
  }
});

export default router;
