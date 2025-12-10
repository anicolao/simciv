# SimCiv Development Environment

## Overview

SimCiv uses Nix flakes with direnv for automatic environment activation. All development work happens in the Nix environment.

## Tools Provided by Nix

- **Node.js 20.x** - JavaScript runtime for server and client
- **Go (latest stable)** - Simulation engine language
- **MongoDB 7.0** - Database (Linux only; macOS uses Docker via Colima)
- **Git** - Version control
- **npm packages** - All Node.js dependencies
- **Go modules** - All Go dependencies

## Setup

```bash
cd simciv
direnv allow  # First time only
# Environment activates automatically
```

## Development Commands

All commands work in the Nix environment:

```bash
# Build and development
npm install         # Install Node.js dependencies
npm run build       # Build TypeScript and client
npm run dev         # Run development server
npm test            # Run unit tests
npm run test:watch  # Run tests in watch mode
npm run test:e2e    # Run E2E tests

# Go development  
cd simulation
go build -o simciv-sim main.go
go test ./...
cd ..

# Database management
mongo start         # Start MongoDB
mongo stop          # Stop MongoDB
mongo status        # Check MongoDB status
```

## Environment Verification

```bash
echo $IN_NIX_SHELL  # "1" if in Nix

which node  # Should show /nix/store/... path
```

## Troubleshooting

### "Commands not found after setup"

**Symptom:** `node: command not found` or similar.

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

- [DEVELOPMENT.md](DEVELOPMENT.md) - General development environment setup
- [README.md](../README.md) - Project overview and quick start
