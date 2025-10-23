# Manual Testing Instructions

## Prerequisites
1. MongoDB running on localhost:27017
2. Go simulation engine built
3. Node.js server built

## Test Steps

### 1. Start MongoDB
```bash
# Ensure MongoDB is running
mongod --dbpath /path/to/data
```

### 2. Start Simulation Engine
```bash
cd simulation
./simulation
# Should see: "Simulation engine started. Press Ctrl+C to stop."
```

### 3. Start Web Server
```bash
npm start
# Should see: "Server running on port 3000"
```

### 4. Test Map Generation

#### A. Register/Login
1. Navigate to http://localhost:3000
2. Register a new user or login with existing credentials

#### B. Create a Game
1. Click "Create New Game"
2. Select number of players (e.g., 4)
3. Click "Create Game"
4. Game appears in "Waiting for players" state

#### C. Join the Game (with multiple users if testing multiplayer)
1. Open another browser/incognito window
2. Register/login as different user
3. Join the same game
4. Repeat until max players reached

#### D. Game Starts Automatically
1. When last player joins, game state changes to "started"
2. Simulation engine generates map (check console logs)
3. Game year starts at -4000 and increments every second

#### E. View the Map
1. Click "View" on the started game
2. Game details modal opens
3. Map section displays below game details
4. Should see:
   - 20x15 grid of colored tiles
   - Different terrain types (ocean=blue, grassland=green, hills=gray, etc.)
   - Resource markers (letters on some tiles)
   - Starting city marked with star (⭐)
   - Legend showing all terrain types

### Expected Map Appearance
- Ocean tiles: Deep blue (#1e40af)
- Shallow Water: Light blue (#3b82f6)
- Grassland: Green (#22c55e)
- Plains: Lime (#84cc16)
- Forest: Dark green (#166534)
- Hills: Gray (#a8a29e)
- Mountains: Dark gray (#78716c)
- Desert: Yellow (#eab308)
- Tundra: Light gray (#e5e7eb)
- Jungle: Very dark green (#14532d)

### Verification Points
- [ ] Map generated successfully (check simulation logs)
- [ ] Map tiles stored in MongoDB (check mapTiles collection)
- [ ] Starting positions assigned (check startingPositions collection)
- [ ] Client displays map centered on player position
- [ ] Different terrain types visible
- [ ] Resources indicated on tiles
- [ ] Starting city marked
- [ ] Legend shows all terrain types
