import { Router, Request, Response } from 'express';
import { 
  resetDeterministicUuidCounter, 
  enableE2ETestMode, 
  disableE2ETestMode,
  isE2ETestModeEnabled 
} from '../utils/crypto';

const router = Router();

/**
 * POST /api/test/enable - Enable E2E test mode for deterministic behavior
 */
router.post('/enable', async (req: Request, res: Response): Promise<void> => {
  try {
    enableE2ETestMode();
    resetDeterministicUuidCounter();
    
    res.json({
      success: true,
      message: 'E2E test mode enabled'
    });
  } catch (error) {
    console.error('Error enabling E2E test mode:', error);
    res.status(500).json({ error: 'Failed to enable E2E test mode' });
  }
});

/**
 * POST /api/test/disable - Disable E2E test mode
 */
router.post('/disable', async (req: Request, res: Response): Promise<void> => {
  try {
    disableE2ETestMode();
    
    res.json({
      success: true,
      message: 'E2E test mode disabled'
    });
  } catch (error) {
    console.error('Error disabling E2E test mode:', error);
    res.status(500).json({ error: 'Failed to disable E2E test mode' });
  }
});

/**
 * POST /api/test/reset-uuid-counter - Reset deterministic UUID counter for E2E tests
 */
router.post('/reset-uuid-counter', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isE2ETestModeEnabled()) {
      res.status(403).json({ error: 'E2E test mode is not enabled' });
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

/**
 * GET /api/test/status - Check E2E test mode status
 */
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  res.json({
    e2eTestMode: isE2ETestModeEnabled()
  });
});

export default router;
