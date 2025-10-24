# SimCiv Development Recipes

Quick reference for common development tasks in the two-tier environment.

## Prerequisites

- Ubuntu 24.04+ (or other Debian-based system)
- System tools: `bash`, `screen` (for Nix setup)

## One-Time Setup

### Install Nix Environment

```bash
# Run the automated setup script
./SETUP_NIX_BIN.sh

# Log out and log back in (required for group membership)
# Then allow direnv in the project
cd simciv
direnv allow
```

**What this does:**
- Installs `nix-bin` and `direnv` from apt
- Configures Nix to enable flakes
- Adds you to the `nix-users` group
- Sets up direnv hook in your shell

## Daily Development

### Start Your Work Session

```bash
# Navigate to project (direnv activates Nix automatically)
cd simciv

# Verify environment loaded
which node    # Should show /nix/store/.../bin/node
node --version # Should show v20.19.5
```

### Build and Run

**Inside Nix (most work):**

```bash
# Install Node.js dependencies
npm install

# Build TypeScript server and Svelte client
npm run build

# Start MongoDB
mongo start

# Run development server (in one terminal)
npm run dev

# Build and run Go simulation (in another terminal)
cd simulation
go build -o simciv-sim main.go
./simciv-sim
```

### Testing

**Unit Tests (Inside Nix):**

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run Go tests
cd simulation
go test ./...
```

**Integration Tests with MongoDB:**

Since mongodb-memory-server has download issues inside Nix, use an external MongoDB:

```bash
# Inside Nix: Start MongoDB
mongo start

# In another terminal, inside Nix: Run integration tests
TEST_MONGO_URI="mongodb://localhost:27017" npm test
```

**E2E Tests (OUTSIDE Nix):**

E2E tests with Playwright **must** run outside the Nix shell:

```bash
# Exit Nix environment (if using direnv, cd to different directory)
cd /tmp

# Run e2e setup script (sets up everything for E2E tests)
cd /path/to/simciv
bash bin/e2e-setup

# Run E2E tests
npm run test:e2e

# Or run specific test file
npx playwright test e2e/auth.spec.ts
```

## Quick Troubleshooting

### "Command not found" errors

```bash
# Verify you're in the Nix environment
echo $IN_NIX_SHELL  # Should output "1"

# If not, navigate to project directory
cd simciv  # direnv should activate
```

### Playwright tests fail with missing libraries

```bash
# Are you inside Nix? Exit it!
cd /tmp  # Move out of project directory

# Then run tests from outside
cd /path/to/simciv
npm run test:e2e
```

### MongoDB won't start

```bash
# Check MongoDB status
mongo status

# Restart MongoDB
mongo restart

# If using MongoDB in Docker, ensure Docker is running
docker ps
```

### npm install fails

```bash
# Ensure you're inside Nix environment
which npm  # Should show /nix/store/.../bin/npm

# Try clearing npm cache
npm cache clean --force
npm install
```

## Environment Verification

### Check if you're in Nix

```bash
# Method 1: Check environment variable
echo $IN_NIX_SHELL  # "1" if in Nix, empty otherwise

# Method 2: Check tool paths
which node
# Inside Nix:  /nix/store/...../bin/node
# Outside Nix: /usr/bin/node or similar
```

### Verify all tools are available

```bash
# Inside Nix, run:
node --version  # v20.19.5
go version      # go1.25.2
mongod --version # db version v7.0.24
npm --version   # 10.8.2
```

## Common Workflows

### Full Clean Build

```bash
# Inside Nix:
rm -rf node_modules dist public/assets
npm install
npm run build

# Build Go simulation
cd simulation
go clean
go build -o simciv-sim main.go
cd ..
```

### Run Complete Test Suite

```bash
# Inside Nix: Unit tests with external MongoDB
mongo start
TEST_MONGO_URI="mongodb://localhost:27017" npm test

# Inside Nix: Go tests
cd simulation && go test ./...

# OUTSIDE Nix: E2E tests
cd /tmp && cd - && npm run test:e2e
```

### Develop New Feature

```bash
# Inside Nix: Start MongoDB and dev server
mongo start
npm run dev  # Terminal 1

# Inside Nix: Start simulation engine
cd simulation && ./simciv-sim  # Terminal 2

# Inside Nix: Run tests in watch mode
npm run test:watch  # Terminal 3

# Make your changes...
# Tests re-run automatically on file save
```

## Performance Tips

### Use Persistent Nix Shell (Optional)

For reduced overhead when running many commands:

```bash
# Initialize persistent shell (one-time per session)
nix-shell-persistent init

# Run commands instantly (no direnv reload)
nix-shell-persistent exec npm install
nix-shell-persistent exec npm run build
nix-shell-persistent exec npm test

# When done
nix-shell-persistent cleanup
```

See [PERSISTENT_NIX_SHELL.md](PERSISTENT_NIX_SHELL.md) for details.

## What Goes Where

### Inside Nix ✅

- npm install
- npm run build
- npm run dev
- npm test (with TEST_MONGO_URI)
- go build
- go test
- mongo start/stop/status
- Most development work

### Outside Nix ❌

- npm run test:e2e (Playwright)
- ./SETUP_NIX_BIN.sh (initial setup)

## Related Documentation

- [ENVIRONMENT_STRUCTURE.md](ENVIRONMENT_STRUCTURE.md) - Complete two-tier environment guide
- [DEVELOPMENT.md](DEVELOPMENT.md) - General development setup
- [NIX_TOOLING_FRICTION.md](NIX_TOOLING_FRICTION.md) - Playwright/Nix issues explained
- [NIX_BIN_SETUP.md](NIX_BIN_SETUP.md) - nix-bin installation details
- [PERSISTENT_NIX_SHELL.md](PERSISTENT_NIX_SHELL.md) - Persistent shell for efficiency

---

**TL;DR:**
- Do everything inside Nix except Playwright E2E tests
- `direnv` makes Nix activation automatic when you `cd simciv`
- E2E tests: `cd /tmp && cd - && npm run test:e2e`
