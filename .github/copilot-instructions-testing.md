# Testing Instructions for GitHub Copilot

This document provides complete instructions for running all tests in the SimCiv project, based on proven workflows from prior completed PRs.

## Test Types

The project has three types of tests:
1. **Go Unit Tests** - Test the simulation engine and map generation logic
2. **TypeScript Integration Tests** - Test the API endpoints and database interactions
3. **Playwright E2E Tests** - Test the full user interface and workflows

## MongoDB Setup for Tests

MongoDB is required for integration tests and e2e tests. Use the `bin/mongo` script that manages MongoDB in Docker:

```bash
# Get the mongo management script from main branch
git show main:bin/mongo > /tmp/mongo-script.sh
chmod +x /tmp/mongo-script.sh

# Start MongoDB in Docker container
/tmp/mongo-script.sh start

# Check status
/tmp/mongo-script.sh status

# Stop when done
/tmp/mongo-script.sh stop
```

**What this script does:**
- Starts a MongoDB 7.0 Docker container named `simciv-mongo`
- Exposes it on `localhost:27017`
- Works on both Linux and macOS (using Colima on macOS)
- Automatically handles Docker availability checks

## Running Go Unit Tests

Go tests can be run without any external dependencies:

```bash
cd simulation
go test ./... -v
```

Or to test specific packages:

```bash
# Test map generation only
go test ./pkg/mapgen -v

# Test engine only
go test ./pkg/engine -v

# Test models only
go test ./pkg/models -v
```

**Expected Results:**
- All tests should pass
- Map generation tests verify terrain variety, resource distribution, and player placement
- Engine tests verify game tick processing and map generation triggers

## Running TypeScript Integration Tests

TypeScript integration tests require MongoDB to be running.

### Recommended Approach: Use External MongoDB

```bash
# Start MongoDB first (see MongoDB Setup section above)
/tmp/mongo-script.sh start

# Run integration tests
TEST_MONGO_URI="mongodb://localhost:27017" npm test
```

### Alternative: Use MongoDB Memory Server

```bash
# This is slower and may have download issues in some environments
npm test
```

**Note:** MongoDB Memory Server may timeout or fail with download errors in CI environments. The external MongoDB approach is more reliable.

**Expected Results:**
- Integration tests for map API endpoints should pass
- Tests verify authentication, authorization, and data filtering
- Tests verify correct error handling for invalid requests

## Running Playwright E2E Tests

**IMPORTANT:** E2E tests generate screenshot PNG files that MUST be committed to the repository. Screenshots document the user workflow and validate UI layout.

### Complete E2E Test Workflow

This is the proven workflow from prior PRs (#9, #11, #14):

#### 1. Start MongoDB

```bash
# Get script from main branch (if not already done)
git show main:bin/mongo > /tmp/mongo-script.sh
chmod +x /tmp/mongo-script.sh

# Start MongoDB in Docker
/tmp/mongo-script.sh start

# Verify it's running
/tmp/mongo-script.sh status
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Build the Project

```bash
npm run build
```

This compiles TypeScript and builds the Svelte client.

#### 4. Start the Simulation Engine

```bash
cd simulation
go build -o simulation
./simulation &
SIMULATION_PID=$!
cd ..
```

The simulation engine runs in the background and processes game ticks.

#### 5. Start the Web Server

```bash
npm start &
SERVER_PID=$!
```

#### 6. Wait for Server to Be Ready

```bash
sleep 5
curl -s http://localhost:3000 > /dev/null && echo "✅ Server ready" || echo "❌ Server not ready"
```

#### 7. Install Playwright Browsers (First Time Only)

```bash
npx playwright install chromium --with-deps
```

**Note:** Playwright browser installation downloads Chromium and system dependencies. This may fail in some CI environments due to:
- Network connectivity issues
- Missing system packages
- Disk space limitations

If browser installation fails, e2e tests cannot run and screenshots cannot be generated.

#### 8. Run the E2E Tests

```bash
npm run test:e2e
```

This runs all e2e tests in the `e2e/` directory. Tests will:
- Launch Chromium browser
- Navigate through user workflows (auth, game creation, map viewing)
- Capture screenshots at key UI states
- Save screenshots to `e2e-screenshots/` directory

#### 9. Verify and Commit Generated Screenshots

```bash
# Check that new screenshots were generated
ls -la e2e-screenshots/*.png

# View git status to see new screenshots
git status

# Stage and commit all screenshots
git add e2e-screenshots/*.png
git add e2e-screenshots/README.md
```

**CRITICAL:** Screenshots MUST be committed. They serve as:
- Visual documentation of user workflows
- Regression test baselines for UI changes
- Evidence that e2e tests were successfully run

#### 10. Cleanup (Stop Services)

```bash
# Stop server and simulation
kill $SERVER_PID $SIMULATION_PID

# Stop MongoDB
/tmp/mongo-script.sh stop
```

### Running Specific Test Files

```bash
# Run only authentication tests
npx playwright test e2e/auth.spec.ts

# Run only game creation tests
npx playwright test e2e/game-creation.spec.ts  

# Run only map view tests
npx playwright test e2e/map-view.spec.ts
```

### Debugging E2E Test Failures

If tests fail:

1. **Check that all services are running:**
```bash
# MongoDB should be running
/tmp/mongo-script.sh status

# Server should be accessible
curl http://localhost:3000

# Simulation should have log output
# Check wherever you're logging simulation output
```

2. **Run tests in headed mode to see the browser:**
```bash
npx playwright test --headed
```

3. **Check Playwright logs for errors:**
```bash
npx playwright test --debug
```

4. **Verify Chromium is installed:**
```bash
npx playwright  --version
ls -la ~/.cache/ms-playwright/
```

## Test Coverage Summary

### Go Unit Tests (simulation/pkg/)
- **mapgen/generator_test.go** (7 tests)
  - Map generation with different player counts
  - Deterministic generation with same seed
  - Terrain variety and distribution
  - Resource distribution
  - Player starting position placement and spacing
  - Tile visibility

- **engine/engine_test.go** (7 tests)
  - Game tick processing
  - Map generation on first tick when game starts
  - Game state transitions
  - Time progression

- **models/** (4 tests)
  - Data model validation

### TypeScript Integration Tests (src/__tests__/integration/)
- **map.test.ts** (9 tests)
  - GET /api/map/:gameId/metadata endpoint
  - GET /api/map/:gameId/tiles endpoint with visibility filtering
  - GET /api/map/:gameId/starting-position endpoint
  - Authentication and authorization checks
  - Error handling (401, 404 responses)

### Playwright E2E Tests (e2e/)
- **auth.spec.ts** (multiple tests)
  - User registration workflow
  - User login workflow
  - Session management
  - Error handling
  - Screenshots: 01-08

- **game-creation.spec.ts** (multiple tests)
  - Create new game
  - Join existing game
  - Start game
  - Game time progression
  - Game details modal
  - Screenshots: 09-18

- **map-view.spec.ts** (4 tests)
  - Map display in started games
  - Starting city marker visibility
  - Resource markers on tiles
  - Conditional rendering (no map when game waiting)
  - Screenshots: 19-23

## Troubleshooting

### "Cannot find module 'mongodb'" or similar errors
Run `npm install` to install all dependencies.

### "MongoDB connection refused"
Start MongoDB using the mongo script: `/tmp/mongo-script.sh start`

### "Playwright browser not installed"
Run `npx playwright install chromium --with-deps`

### "Browser download failed"
This is a known issue in some CI environments. Playwright may not be able to download browsers due to network restrictions or missing dependencies. If this occurs:
- Try the installation command again
- Check internet connectivity
- Verify disk space availability  
- Check system dependencies are installed

### "Tests timeout waiting for server"
- Verify server is running: `curl http://localhost:3000`
- Check server logs for errors
- Ensure MongoDB is running
- Ensure simulation engine is running

### "Screenshots not generated"
- Verify e2e tests completed successfully
- Check `e2e-screenshots/` directory exists
- Verify Playwright browser is installed
- Run tests with `--debug` flag to see detailed output
