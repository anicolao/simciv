# SimCiv Game Creation System (v0.0002)

## Overview

Version 0.0002 implements a complete multiplayer game creation and management system, allowing players to create games, join games, and see time progress in real-time.

## Features

### Game Creation
- Create games with 2-8 players
- Creator automatically joins as first player
- Games start in "waiting" state
- Simple one-parameter creation (player count only)

### Game Joining
- Browse all available games
- Join games with open slots
- Automatic game start when full
- Optimistic locking prevents race conditions

### Time Progression
- Games start at 5000 BC
- 1 year progresses per real second
- Continuous simulation while game is active
- Real-time updates in UI (2 second polling)

## Architecture

### Backend (Node.js + TypeScript)
- **API Routes** (`src/routes/games.ts`):
  - `POST /api/games` - Create new game
  - `GET /api/games` - List all games
  - `GET /api/games/:gameId` - Get specific game
  - `POST /api/games/:gameId/join` - Join a game
  - `GET /api/games/user/my-games` - Get user's games

- **Database Schema** (MongoDB):
  ```typescript
  interface Game {
    gameId: string;          // UUID
    creatorUserId: string;   // User alias
    maxPlayers: number;      // 2-8
    currentPlayers: number;  // Current count
    playerList: string[];    // Array of user aliases
    state: 'waiting' | 'started';
    currentYear: number;     // Starts at -5000 (5000 BC)
    createdAt: Date;
    startedAt?: Date;
    lastTickAt?: Date;
  }
  ```

- **Indexes**:
  - `gameId` (unique)
  - `state` (for filtering)
  - `createdAt` (for sorting)

### Simulation Engine (Go)
Located in `simulation/` directory:

- **Main Process** (`main.go`):
  - Connects to MongoDB
  - Starts game engine loop
  - Handles graceful shutdown

- **Engine** (`pkg/engine/engine.go`):
  - Polls for started games every 100ms
  - Processes ticks for games needing updates
  - Updates game year and lastTickAt

- **Repository** (`pkg/repository/mongo.go`):
  - MongoDB connection management
  - Game CRUD operations
  - Tick updates

### Frontend (Svelte)
Located in `client/src/`:

- **GameLobby Component** (`lib/GameLobby.svelte`):
  - Lists all games with state
  - Create game form
  - Join game buttons
  - Real-time year display
  - Game details modal
  - Auto-refresh every 2 seconds

- **API Client** (`utils/api.ts`):
  - TypeScript API wrappers
  - Game management functions
  - Type-safe interfaces

## Running the System

### Prerequisites
- Node.js v18+
- Go 1.24+
- MongoDB (running on localhost:27017 or set `MONGO_URI`)

### Start Backend Server
```bash
npm install
npm run build
npm start
# Or for development:
npm run dev
```

Server runs on http://localhost:3000

### Start Simulation Engine
```bash
cd simulation
go build -o simciv-sim main.go
./simciv-sim
```

The simulation engine will:
- Connect to MongoDB
- Start processing game ticks
- Log progress every 100 years

### Environment Variables
```bash
# Backend (Node.js)
PORT=3000
MONGO_URI=mongodb://localhost:27017
DB_NAME=simciv

# Simulation (Go)
MONGO_URI=mongodb://localhost:27017  # Defaults to localhost:27017
DB_NAME=simciv                        # Defaults to simciv
```

## Testing

### Unit Tests
```bash
# TypeScript unit tests (games)
npm test src/__tests__/unit/games.test.ts

# Go unit tests
cd simulation && go test ./...
```

**Results**:
- TypeScript: 11 tests passing (game creation, joining, validation)
- Go: 6 tests passing (models, engine, tick progression)

### Integration Tests
```bash
# Start MongoDB
docker run -d -p 27017:27017 mongo:7.0

# Run integration tests
TEST_MONGO_URI="mongodb://localhost:27017" npm test
```

**Results**: 11 integration tests passing
- Game creation flow
- Multi-player joining
- Auto-start when full
- Database persistence
- State transitions

### E2E Tests
```bash
# Start MongoDB, backend server, and simulation engine
# Then run:
npm run test:e2e
```

Test scenarios defined in `e2e/game-creation.spec.ts`:
- Creating games
- Joining games
- Auto-start verification
- Time progression display
- Race condition handling

## API Examples

### Create a Game
```bash
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -H "Cookie: simciv_session=YOUR_SESSION_GUID" \
  -d '{"maxPlayers": 4}'
```

Response:
```json
{
  "success": true,
  "game": {
    "gameId": "550e8400-e29b-41d4-a716-446655440000",
    "maxPlayers": 4,
    "currentPlayers": 1,
    "state": "waiting",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Join a Game
```bash
curl -X POST http://localhost:3000/api/games/GAME_ID/join \
  -H "Content-Type: application/json" \
  -H "Cookie: simciv_session=YOUR_SESSION_GUID"
```

### List All Games
```bash
curl http://localhost:3000/api/games
```

Response:
```json
{
  "success": true,
  "games": [
    {
      "gameId": "550e8400-e29b-41d4-a716-446655440000",
      "creatorUserId": "alice",
      "maxPlayers": 4,
      "currentPlayers": 2,
      "state": "waiting",
      "currentYear": -5000,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "gameId": "660e8400-e29b-41d4-a716-446655440001",
      "creatorUserId": "bob",
      "maxPlayers": 2,
      "currentPlayers": 2,
      "state": "started",
      "currentYear": -4985,
      "createdAt": "2024-01-01T00:01:00.000Z",
      "startedAt": "2024-01-01T00:01:30.000Z"
    }
  ]
}
```

## Game Flow

1. **User Creates Game**:
   - Selects player count (2-8)
   - Clicks "Create Game"
   - Immediately joins as player 1
   - Game enters "waiting" state

2. **Other Users Join**:
   - Browse game lobby
   - See games with open slots
   - Click "Join" button
   - Player count increases

3. **Game Auto-Starts**:
   - When last player joins (currentPlayers === maxPlayers)
   - State changes to "started"
   - startedAt and lastTickAt timestamps set
   - Simulation engine begins processing

4. **Time Progresses**:
   - Simulation engine ticks every second
   - currentYear increments by 1 each tick
   - UI displays current year (e.g., "4985 BC")
   - Updates visible in real-time via polling

## Database Queries

### Find Started Games (Simulation)
```javascript
db.games.find({ state: "started" })
```

### Find Joinable Games
```javascript
db.games.find({
  state: "waiting",
  $expr: { $lt: ["$currentPlayers", "$maxPlayers"] }
})
```

### Get User's Games
```javascript
db.games.find({ playerList: "alice" })
```

## Troubleshooting

### Simulation Not Progressing
1. Check simulation engine is running: `ps aux | grep simciv-sim`
2. Check MongoDB connection in sim logs
3. Verify games are in "started" state: `db.games.find({ state: "started" })`

### Games Not Auto-Starting
1. Check optimistic locking in join endpoint
2. Verify currentPlayers === maxPlayers in database
3. Check server logs for errors

### UI Not Updating
1. Verify polling is active (check network tab)
2. Check /api/games endpoint returns correct data
3. Clear browser cache and reload

## Performance Considerations

- **Polling Interval**: Currently 2 seconds; can be adjusted in GameLobby.svelte
- **Simulation Load**: Each game processes 1 tick/second; scales to ~100 concurrent games per instance
- **Database Load**: Indexes on state and createdAt optimize queries
- **Concurrent Joins**: Optimistic locking prevents race conditions

## Future Enhancements

See `0.0002creategame.md` for planned features:
- Private games
- Game settings (map size, speed)
- Pause/resume
- Spectator mode
- In-game chat
- Victory conditions

## Security Notes

- All game operations require authenticated session
- maxPlayers validated server-side (2-8)
- Optimistic locking prevents duplicate joins
- Race conditions handled via MongoDB atomic updates

## Related Documentation

- [Authentication System](../designs/version0.0001.md) - v0.0001 auth design
- [Game Creation Design](../0.0002creategame.md) - Full v0.0002 specification
- [Initial Design](../INITIAL_DESIGN.md) - Overall architecture
- [API Documentation](./API.md) - Complete API reference (TODO)
