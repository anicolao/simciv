import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { connectToDatabase } from './db/connection';
import { config } from './config';
import { sessionMiddleware } from './middleware/session';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/session';
import gamesRoutes from './routes/games';
import mapRoutes from './routes/map';
import settlersRoutes from './routes/settlers';
import testUtilsRoutes from './routes/test-utils';

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Initialize database and start server
async function startServer() {
  try {
    // Connect to database
    await connectToDatabase(config.mongoUri, config.dbName);
    console.log('Connected to MongoDB');

    // Session middleware (applies to all routes)
    app.use(sessionMiddleware);

    // Root path - redirect to session GUID URL
    app.get('/', (req, res) => {
      if (req.sessionGuid) {
        res.redirect(`/id=${req.sessionGuid}`);
      } else {
        res.status(500).json({ error: 'Failed to create session' });
      }
    });

    // Session-specific path
    app.get('/id=:guid', (req, res) => {
      const { guid } = req.params;
      
      // Validate GUID matches cookie or update cookie
      if (req.sessionGuid !== guid) {
        // Redirect to the cookie's GUID (cookie wins)
        res.redirect(`/id=${req.sessionGuid}`);
        return;
      }

      // Serve the client application
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
    
    // Static files (after routes to prevent index.html from being served at /)
    app.use(express.static(path.join(__dirname, '../public')));

    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/session', sessionRoutes);
    app.use('/api/games', gamesRoutes);
    app.use('/api/map', mapRoutes);
    app.use('/api/game', settlersRoutes);
    app.use('/api/test', testUtilsRoutes); // Test utilities for E2E testing

    // Error handler
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // Start server
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
