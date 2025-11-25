# SimCiv Development Environment Structure

## Overview

SimCiv uses a **two-tier development environment** that balances reproducibility with pragmatism. Most development work happens in a "Pure Nix" environment, but Playwright E2E tests require running outside Nix due to binary compatibility.

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

Enter the Nix environment using direnv:

```bash
cd simciv
direnv allow  # First time only
# Environment activates automatically
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
```

## Tier 2: System Dependencies

### What Goes Here

Tools that must run outside Nix due to FHS binary compatibility issues:

#### **Playwright** (E2E testing)

**Why outside Nix:** Playwright downloads pre-compiled Chromium binaries that expect system libraries in FHS standard locations (`/lib`, `/usr/lib`, etc.). Inside Nix, library paths point to `/nix/store` and Playwright's browsers can't find required libraries.

**Workaround:** Run Playwright E2E tests outside the Nix shell:

```bash
# Exit Nix and run E2E tests
cd /tmp && cd - && npm run test:e2e
```

## Development Workflow

### Setup

```bash
# Clone and enter project
git clone https://github.com/anicolao/simciv.git
cd simciv
direnv allow
```

### Daily Development

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
# Run E2E tests (must be outside Nix)
cd /tmp && cd - && npm run test:e2e
```

### Key Principle

**Do as much as possible in Nix, accept minimal exceptions for binary compatibility.**

- ✅ Build inside Nix
- ✅ Test (unit/integration) inside Nix  
- ✅ Development server inside Nix
- ✅ Go simulation inside Nix
- ✅ MongoDB management inside Nix
- ❌ Playwright E2E tests must run outside Nix

## Environment Cheat Sheet

### "Am I in Nix?"

```bash
echo $IN_NIX_SHELL  # "1" if in Nix, empty otherwise

# Or check tool paths
which node
# Nix: /nix/store/...
# System: /usr/bin/node
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

## Troubleshooting

### "Playwright tests fail with missing libraries"

**Symptom:** Error messages about missing `libglib-2.0.so.0`, `libnspr4.so`, etc.

**Cause:** Running Playwright inside Nix shell.

**Solution:** Exit Nix shell and run tests:
```bash
cd /tmp && cd - && npm run test:e2e
```

### "Commands not found after setup"

**Symptom:** `node: command not found` or similar.

**Cause:** Not in Nix environment.

**Solution:**
```bash
cd simciv  # Should auto-load environment via direnv
which node  # Should show /nix/store/... path
```

### "MongoDB won't start"

**Solution:**
```bash
mongo status
which mongod
# On macOS: colima status
```

## Related Documentation

- [NIX_TOOLING_FRICTION.md](NIX_TOOLING_FRICTION.md) - Detailed Playwright/Nix issues
- [DEVELOPMENT.md](DEVELOPMENT.md) - General development environment setup
- [E2E_TEST_SETUP.md](E2E_TEST_SETUP.md) - E2E test environment setup
- [README.md](../README.md) - Project overview and quick start
