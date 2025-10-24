# SimCiv Development Environment Structure

## Overview

SimCiv uses a **two-tier development environment** that balances reproducibility with pragmatism. Most development work happens in a "Pure Nix" environment, but some tools require "System Dependencies" to function properly.

## The Two-Tier Philosophy

### Why Two Tiers?

Many Linux tools, including Playwright's pre-compiled browser binaries, are built with assumptions about the [Linux Filesystem Hierarchy Standard (FHS)](https://en.wikipedia.org/wiki/Filesystem_Hierarchy_Standard). They expect shared libraries to be in specific locations like `/lib`, `/usr/lib`, etc.

Nix takes a different approach: it stores everything in `/nix/store` with cryptographic hashes. This creates excellent reproducibility but breaks tools that ship pre-compiled binaries expecting FHS paths.

**We have two options:**
1. Install everything "the Nix way" to make it work in the Nix environment
2. Keep minimal exceptions for tools that ship pre-compiled binaries

**We chose option #2** because:
- It's pragmatic for tools like Playwright that manage their own binaries
- It minimizes complexity for tools that are designed to install other tools
- It keeps the "System Dependencies" category as small as possible
- Most development work still happens in the reproducible Nix environment

## Tier 1: Pure Nix Environment

### What Goes Here

Tools and dependencies managed by Nix that provide reproducible development environments:

- **Node.js 20.x** - JavaScript runtime for server and client
- **Go (latest stable)** - Simulation engine language
- **MongoDB 7.0** - Database (Linux only; macOS uses Docker via Colima)
- **Git** - Version control
- **npm packages** - All Node.js dependencies
- **Go modules** - All Go dependencies

### How to Use

Enter the Nix environment using one of these methods:

#### Option A: Direct Nix (if you have full Nix installation)

```bash
nix develop
# Everything is now available
```

#### Option B: direnv (automatic activation)

```bash
cd simciv
direnv allow  # First time only
# Environment activates automatically
```

#### Option C: nix-bin with direnv (Ubuntu/Debian)

```bash
# One-time setup
./SETUP_NIX_BIN.sh
# Log out and log back in

# Then direnv works automatically
cd simciv
direnv allow  # First time only
```

### What Works Inside Nix

✅ **These commands work perfectly inside the Nix environment:**

```bash
# Build and development
npm install         # Install Node.js dependencies
npm run build       # Build TypeScript and client
npm run dev         # Run development server
npm test            # Run unit tests
npm run test:watch  # Run tests in watch mode

# Go development  
cd simulation
go build -o simciv-sim main.go
go test ./...
cd ..

# Database management
mongo start         # Start MongoDB (uses native mongod on Linux, Docker on macOS)
mongo stop          # Stop MongoDB
mongo status        # Check MongoDB status

# Most e2e-setup steps
# (everything except Playwright browser installation and execution)
```

✅ **Build, test, and run** - All core development workflows work in Nix

## Tier 2: System Dependencies

### What Goes Here

Tools that must run outside Nix due to FHS binary compatibility issues:

#### 1. **Playwright** (E2E testing)

**Why outside Nix:** Playwright downloads pre-compiled Chromium binaries that expect system libraries in FHS standard locations (`/lib`, `/usr/lib`, etc.). Inside Nix, library paths point to `/nix/store` and Playwright's browsers can't find required libraries.

**Error when run inside Nix:**
```
Host system is missing dependencies to run browsers.
Missing libraries:
    libglib-2.0.so.0
    libgobject-2.0.so.0
    libnspr4.so
    libnss3.so
    ... (many more)
```

**Workaround:** Run Playwright E2E tests outside the Nix shell using system-installed dependencies.

#### 2. **screen** (Nix setup dependency)

**Why outside Nix:** Required by `SETUP_NIX_BIN.sh` to create the persistent shell manager. Must be installed via system package manager before Nix setup.

#### 3. **bash** (Nix setup dependency)

**Why outside Nix:** Required to run the initial `SETUP_NIX_BIN.sh` script. Available on all Unix-like systems.

### How to Use

These tools run in your normal system environment (outside Nix):

```bash
# Outside Nix: System dependencies for setup
sudo apt-get install screen   # Ubuntu/Debian (if not already installed)
./SETUP_NIX_BIN.sh            # Initial Nix environment setup

# Outside Nix: Playwright E2E tests
npm run test:e2e              # Runs Playwright tests with system Chromium
npx playwright test e2e/      # Alternative command
```

## Complete Development Workflow

### Initial Setup (One-Time)

**Prerequisites (System Dependencies):**
```bash
# Verify system has bash and screen
which bash    # Should return /bin/bash or /usr/bin/bash
which screen  # Should return /usr/bin/screen

# If screen is missing on Ubuntu/Debian:
sudo apt-get install screen
```

**Setup Nix Environment:**
```bash
# Option 1: Full Nix installation (NixOS or nix-darwin)
# Follow instructions at https://nixos.org/download.html

# Option 2: nix-bin (Ubuntu/Debian lightweight option)
./SETUP_NIX_BIN.sh
# Log out and log back in for group membership to take effect
cd simciv
direnv allow
```

### Daily Development Workflow

**Inside Nix (Most Work):**
```bash
# 1. Enter project directory (direnv activates Nix environment)
cd simciv

# 2. Start MongoDB
mongo start

# 3. Install/update dependencies
npm install
cd simulation && go mod download && cd ..

# 4. Build everything
npm run build
cd simulation && go build -o simciv-sim main.go && cd ..

# 5. Run development server
npm run dev
# In another terminal:
cd simulation && ./simciv-sim

# 6. Run unit tests
npm test
cd simulation && go test ./... && cd ..
```

**Outside Nix (E2E Tests Only):**
```bash
# Setup E2E environment (run once, or after clean)
bash bin/e2e-setup

# Run E2E tests (must be outside Nix)
npm run test:e2e
```

### Key Principle

**Do as much as possible in Nix, accept minimal exceptions for binary compatibility.**

- ✅ Build inside Nix
- ✅ Test (unit/integration) inside Nix  
- ✅ Development server inside Nix
- ✅ Go simulation inside Nix
- ✅ MongoDB management inside Nix
- ❌ Playwright E2E tests must run outside Nix

## Documented Friction Points

### Current Known Issues

**1. Playwright Browser Dependencies (Documented in NIX_TOOLING_FRICTION.md)**

- **Issue:** Playwright browsers can't find system libraries inside Nix shell
- **Root Cause:** Pre-compiled binaries expect FHS library paths
- **Workaround:** Run `npm run test:e2e` outside Nix shell
- **Status:** Accepted limitation, documented workaround

**2. None Identified** (as of 2025-10-24)

The current system works well with this single known exception.

## Environment Cheat Sheet

### "Am I in Nix?"

```bash
# Check if in Nix environment
echo $IN_NIX_SHELL
# Outputs: "1" if in Nix, empty otherwise

# Alternative check
which node
# Nix: /nix/store/...
# System: /usr/bin/node or similar
```

### "Which commands run where?"

| Command | Environment | Notes |
|---------|-------------|-------|
| `npm install` | ✅ Inside Nix | Uses Nix's Node.js |
| `npm run build` | ✅ Inside Nix | TypeScript, Vite |
| `npm test` | ✅ Inside Nix | Vitest unit tests |
| `npm run dev` | ✅ Inside Nix | Development server |
| `go build` | ✅ Inside Nix | Uses Nix's Go |
| `go test ./...` | ✅ Inside Nix | Go unit tests |
| `mongo start` | ✅ Inside Nix | MongoDB management |
| `npm run test:e2e` | ❌ Outside Nix | **Playwright E2E tests** |
| `./SETUP_NIX_BIN.sh` | ❌ Outside Nix | Initial setup script |
| `bash bin/e2e-setup` | ⚠️ Partial | Most steps work in Nix, Playwright install may need system |

## Troubleshooting

### "Playwright tests fail with missing libraries"

**Symptom:** Error messages about missing `libglib-2.0.so.0`, `libnspr4.so`, etc.

**Cause:** Running Playwright inside Nix shell.

**Solution:** Exit Nix shell and run tests in system environment:
```bash
# If using direnv, move to a different directory
cd /tmp

# Or explicitly exit Nix shell
exit  # if you used 'nix develop'

# Then run tests
cd /path/to/simciv
npm run test:e2e
```

### "Commands not found after Nix setup"

**Symptom:** `node: command not found` or similar.

**Cause:** Not in Nix environment.

**Solution:**
```bash
# If using direnv
cd simciv  # Should auto-load environment

# If using nix develop
nix develop

# Verify
which node  # Should show /nix/store/... path
```

### "MongoDB won't start"

**Symptom:** `mongo start` fails.

**Cause:** Multiple possibilities.

**Solution:**
```bash
# Check MongoDB status
mongo status

# On Linux: Verify native MongoDB is available
which mongod

# On macOS: Verify Colima is running
colima status

# On macOS: Start Colima if needed
colima start
```

## Future Improvements

Potential areas for enhancement:

1. **nixGL Integration:** Explore using nixGL to provide OpenGL/graphics libraries for Playwright
2. **Playwright in Docker:** Consider running Playwright in Docker containers instead of local browsers
3. **Better Nix Playwright:** Monitor Nix packages for better Playwright browser support
4. **Reduce System Dependencies:** Continue minimizing the "System Dependencies" category

## Related Documentation

- [NIX_TOOLING_FRICTION.md](NIX_TOOLING_FRICTION.md) - Detailed Playwright/Nix issues
- [DEVELOPMENT.md](DEVELOPMENT.md) - General development environment setup
- [NIX_BIN_SETUP.md](NIX_BIN_SETUP.md) - nix-bin installation instructions
- [PERSISTENT_NIX_SHELL.md](PERSISTENT_NIX_SHELL.md) - Persistent shell manager for efficiency
- [E2E_TEST_SETUP.md](E2E_TEST_SETUP.md) - E2E test environment setup
- [README.md](../README.md) - Project overview and quick start

## Summary

SimCiv's two-tier environment structure provides:

- ✅ **Reproducibility** for most development work (Pure Nix)
- ✅ **Pragmatism** for binary compatibility issues (System Dependencies)
- ✅ **Clear documentation** of what runs where
- ✅ **Minimal exceptions** (currently just Playwright)

This approach lets us leverage Nix's benefits while accepting practical limitations of pre-compiled binary tools.
