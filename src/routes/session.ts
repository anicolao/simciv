import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/session/status
 * Get the current session status
 */
router.get('/status', (req: Request, res: Response): void => {
  if (!req.session) {
    res.status(500).json({ error: 'No session available' });
    return;
  }

  res.json({
    sessionGuid: req.sessionGuid,
    state: req.session.state,
    userId: req.session.userId,
    createdAt: req.session.createdAt,
    expiresAt: req.session.expiresAt,
  });
});

export default router;
