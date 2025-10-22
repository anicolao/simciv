import { Request, Response, NextFunction } from 'express';
import { getSessionsCollection } from '../db/connection';
import { generateGuid, isValidGuid } from '../utils/crypto';
import { config } from '../config';
import { Session } from '../models/types';

declare global {
  namespace Express {
    interface Request {
      sessionGuid?: string;
      session?: Session;
    }
  }
}

/**
 * Middleware to extract session GUID from cookie or create a new one
 */
export async function sessionMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let sessionGuid = req.cookies[config.cookieName];
    let session: Session | null = null;

    // If we have a GUID in the cookie, try to load the session
    if (sessionGuid && isValidGuid(sessionGuid)) {
      const sessionsCollection = getSessionsCollection();
      session = await sessionsCollection.findOne({ sessionGuid });

      // Check if session is expired
      if (session && session.expiresAt < new Date()) {
        await sessionsCollection.updateOne(
          { sessionGuid },
          { $set: { state: 'expired' } }
        );
        session = null;
      }
    }

    // If no valid session, create a new one
    if (!session) {
      sessionGuid = generateGuid();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + config.sessionIdleTimeoutMinutes * 60 * 1000);

      session = {
        sessionGuid,
        state: 'unauthenticated',
        createdAt: now,
        lastAccessAt: now,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      };

      await getSessionsCollection().insertOne(session);

      // Set cookie
      res.cookie(config.cookieName, sessionGuid, {
        httpOnly: config.cookieHttpOnly,
        secure: config.cookieSecure,
        sameSite: config.cookieSameSite,
        maxAge: config.sessionIdleTimeoutMinutes * 60 * 1000,
      });
    } else {
      // Update last access time
      const now = new Date();
      const expiresAt = new Date(now.getTime() + config.sessionIdleTimeoutMinutes * 60 * 1000);

      await getSessionsCollection().updateOne(
        { sessionGuid },
        {
          $set: {
            lastAccessAt: now,
            expiresAt,
          },
        }
      );

      session.lastAccessAt = now;
      session.expiresAt = expiresAt;
    }

    req.sessionGuid = sessionGuid;
    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to require authenticated session
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session || req.session.state !== 'authenticated') {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}
