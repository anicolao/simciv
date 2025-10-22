import { Router, Request, Response } from 'express';
import { getUsersCollection, getSessionsCollection, getChallengesCollection } from '../db/connection';
import { generateChallenge, generateGuid, encryptChallenge, validatePublicKey } from '../utils/crypto';
import { config } from '../config';
import { User, Challenge } from '../models/types';

const router = Router();

/**
 * POST /api/auth/check-alias
 * Check if an alias is available
 */
router.post('/check-alias', async (req: Request, res: Response): Promise<void> => {
  try {
    const { alias } = req.body;

    if (!alias || typeof alias !== 'string' || alias.trim().length === 0) {
      res.status(400).json({ error: 'Invalid alias' });
      return;
    }

    const usersCollection = getUsersCollection();
    const existingUser = await usersCollection.findOne({ alias: alias.trim() });

    res.json({ available: !existingUser });
  } catch (error) {
    console.error('Error checking alias:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { alias, publicKey } = req.body;

    // Validate input
    if (!alias || typeof alias !== 'string' || alias.trim().length === 0) {
      res.status(400).json({ error: 'Invalid alias' });
      return;
    }

    if (!publicKey || typeof publicKey !== 'string') {
      res.status(400).json({ error: 'Invalid public key' });
      return;
    }

    // Validate public key format
    if (!validatePublicKey(publicKey)) {
      res.status(400).json({ error: 'Invalid public key format or insufficient key length (minimum 2048 bits RSA required)' });
      return;
    }

    const usersCollection = getUsersCollection();
    const trimmedAlias = alias.trim();

    // Check if alias already exists
    const existingUser = await usersCollection.findOne({ alias: trimmedAlias });
    if (existingUser) {
      res.status(409).json({ error: 'Alias already taken' });
      return;
    }

    // Create user
    const user: User = {
      alias: trimmedAlias,
      publicKey,
      accountStatus: 'active',
      createdAt: new Date(),
    };

    await usersCollection.insertOne(user);

    // Update session to authenticated state
    if (req.session && req.sessionGuid) {
      await getSessionsCollection().updateOne(
        { sessionGuid: req.sessionGuid },
        {
          $set: {
            userId: trimmedAlias,
            state: 'authenticated',
            lastAccessAt: new Date(),
          },
        }
      );
    }

    res.status(201).json({
      success: true,
      alias: trimmedAlias,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/challenge
 * Request an authentication challenge
 */
router.post('/challenge', async (req: Request, res: Response): Promise<void> => {
  try {
    const { alias } = req.body;

    if (!alias || typeof alias !== 'string' || alias.trim().length === 0) {
      res.status(400).json({ error: 'Invalid alias' });
      return;
    }

    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne({ alias: alias.trim() });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.accountStatus !== 'active') {
      res.status(403).json({ error: 'Account is not active' });
      return;
    }

    // Generate challenge
    const challengeText = generateChallenge();
    const challengeId = generateGuid();
    const encryptedChallengeText = encryptChallenge(challengeText, user.publicKey);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.challengeTtlMinutes * 60 * 1000);

    const challenge: Challenge = {
      challengeId,
      alias: user.alias,
      challenge: challengeText,
      encryptedChallenge: encryptedChallengeText,
      createdAt: now,
      expiresAt,
      used: false,
    };

    await getChallengesCollection().insertOne(challenge);

    // Update session state
    if (req.session && req.sessionGuid) {
      await getSessionsCollection().updateOne(
        { sessionGuid: req.sessionGuid },
        { $set: { state: 'authenticating' } }
      );
    }

    res.json({
      challengeId,
      encryptedChallenge: encryptedChallengeText,
    });
  } catch (error) {
    console.error('Error generating challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/respond
 * Submit a challenge response
 */
router.post('/respond', async (req: Request, res: Response): Promise<void> => {
  try {
    const { challengeId, response } = req.body;

    if (!challengeId || typeof challengeId !== 'string') {
      res.status(400).json({ error: 'Invalid challenge ID' });
      return;
    }

    if (!response || typeof response !== 'string') {
      res.status(400).json({ error: 'Invalid response' });
      return;
    }

    const challengesCollection = getChallengesCollection();
    const challenge = await challengesCollection.findOne({ challengeId });

    if (!challenge) {
      res.status(404).json({ error: 'Challenge not found' });
      return;
    }

    if (challenge.used) {
      res.status(400).json({ error: 'Challenge already used' });
      return;
    }

    if (challenge.expiresAt < new Date()) {
      res.status(400).json({ error: 'Challenge expired' });
      return;
    }

    // Mark challenge as used
    await challengesCollection.updateOne(
      { challengeId },
      { $set: { used: true } }
    );

    // Verify response
    if (response !== challenge.challenge) {
      res.status(401).json({ error: 'Invalid response' });
      return;
    }

    // Update user's last login
    const usersCollection = getUsersCollection();
    await usersCollection.updateOne(
      { alias: challenge.alias },
      { $set: { lastLoginAt: new Date() } }
    );

    // Update session to authenticated
    if (req.session && req.sessionGuid) {
      await getSessionsCollection().updateOne(
        { sessionGuid: req.sessionGuid },
        {
          $set: {
            userId: challenge.alias,
            state: 'authenticated',
            lastAccessAt: new Date(),
          },
        }
      );
    }

    res.json({
      success: true,
      alias: challenge.alias,
    });
  } catch (error) {
    console.error('Error validating response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Terminate the current session
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.session && req.sessionGuid) {
      await getSessionsCollection().updateOne(
        { sessionGuid: req.sessionGuid },
        {
          $set: {
            state: 'terminated',
            userId: undefined,
          },
        }
      );
    }

    res.clearCookie(config.cookieName);
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
