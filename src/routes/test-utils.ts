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

/**
 * POST /api/test/tick - Trigger a manual tick for a specific game (E2E mode only)
 */
router.post('/tick', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isE2ETestModeEnabled()) {
      res.status(403).json({ error: 'E2E test mode is not enabled' });
      return;
    }

    const { gameId } = req.body;
    if (!gameId) {
      res.status(400).json({ error: 'gameId is required' });
      return;
    }

    // Forward tick request to game engine control server using http module
    const http = require('http');
    const postData = JSON.stringify({ gameId });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/tick',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const engineReq = http.request(options, (engineRes: any) => {
      let data = '';
      
      engineRes.on('data', (chunk: any) => {
        data += chunk;
      });
      
      engineRes.on('end', () => {
        try {
          const result = JSON.parse(data);
          res.status(engineRes.statusCode).json(result);
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse engine response' });
        }
      });
    });

    engineReq.on('error', (error: any) => {
      res.status(500).json({ error: 'Failed to connect to game engine' });
    });

    engineReq.write(postData);
    engineReq.end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger tick' });
  }
});

export default router;
