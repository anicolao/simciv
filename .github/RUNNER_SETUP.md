# GitHub Copilot Cloud Runner Setup

This document explains how the GitHub Actions runner is configured to provide a consistent Nix-based development environment for GitHub Copilot cloud agents.

## Overview

The SimCiv project uses Nix flakes for reproducible development environments. The GitHub Actions workflow automatically sets up this environment and runs tests at startup, providing Copilot with immediate context about the project state.

## Workflow Configuration

The workflow is defined in `.github/workflows/copilot-runner-setup.yml` and performs:

1. **Environment Setup**
   - Installs Nix with flakes support on Ubuntu 24.04
   - Configures direnv for automatic environment loading
   - Caches Nix store for faster subsequent runs
   - Installs screen for potential persistent shell usage

2. **Dependency Installation**
   - Loads Nix environment with Node.js, Go, and MongoDB
   - Installs npm dependencies
   - Builds TypeScript and Svelte client

3. **Testing**
   - Starts MongoDB service
   - Runs unit tests and captures output
   - Builds Go simulation engine
   - Sets up E2E test environment
   - Runs Playwright E2E tests
   - Generates test summaries in GitHub UI

4. **Artifacts**
   - Uploads test outputs for review
   - Uploads screenshots from E2E tests
   - Creates startup summary with environment status

## For Copilot Cloud Agents

When a Copilot cloud agent starts, it should:

### 1. Check Environment Status

Run the startup script to see current state:

```bash
.github/runner-startup.sh
```

This provides:
- Environment verification (Nix, direnv, tools)
- Service status (MongoDB, server, engine)
- Last test results summary
- Quick command reference

### 2. Load Nix Environment

Always work within the Nix environment for consistency:

```bash
# Enable direnv for the project
direnv allow

# Load environment variables and PATH
eval "$(direnv export bash)"

# Verify tools are available
which node npm go
```

### 3. Working with the Environment

#### Running Commands in Nix Environment

```bash
# After loading with direnv export, run commands normally
npm install
npm run build
npm test
go build
```

#### MongoDB Management

```bash
bin/mongo start    # Start MongoDB container
bin/mongo stop     # Stop MongoDB
bin/mongo status   # Check status
bin/mongo restart  # Restart MongoDB
```

#### Development Workflow

```bash
# In Nix environment
eval "$(direnv export bash)"

# Install and build
npm install
npm run build

# Run unit tests (requires MongoDB)
bin/mongo start
npm test

# Setup and run E2E tests
bin/e2e-setup
npm run test:e2e  # Runs OUTSIDE Nix per project requirements
```

## Key Environment Details

### From flake.nix

- **Node.js**: v20.x
- **Go**: Latest stable (1.24+ preferred)
- **MongoDB**: 7.0 (native on Linux, Docker on macOS)
- **Environment Variables**:
  - `MONGO_URI=mongodb://localhost:27017`
  - `DB_NAME=simciv`
  - `PORT=3000`

### Project Architecture

- **Database-centric**: MongoDB is single source of truth
- **Modular**: Simulation engine (Go) and clients are independent
- **Security**: Cryptographic challenge/response authentication
- **Testing Requirements**: 
  - All tests must pass before PR completion
  - MongoDB must be running for tests
  - E2E tests run OUTSIDE Nix environment
  - Screenshots must be committed for E2E tests

## Test Status Summary

The workflow generates a comprehensive test summary showing:

- ✅/❌ Unit test status
- ✅/❌ E2E test status
- Test output snippets
- Quick command reference

This summary is available in:
- GitHub Actions summary tab
- `startup-summary.md` artifact
- `.github/runner-startup.sh` output

## Troubleshooting

### Nix Environment Not Loading

```bash
# Manually enter Nix shell
nix develop

# Or use direnv
direnv allow
eval "$(direnv export bash)"
```

### MongoDB Not Starting

```bash
# Check if Docker is available (on Linux runners)
docker --version

# Check MongoDB logs
bin/mongo status
docker logs simciv-mongo
```

### Tests Failing

```bash
# Ensure MongoDB is running
bin/mongo status

# Check test outputs
cat unit-test-output.txt
cat e2e-test-output.txt

# Re-run specific tests
npm test -- src/__tests__/unit/crypto.test.ts
npx playwright test e2e/auth.spec.ts
```

### Build Failures

```bash
# Verify Nix environment is loaded
echo $NODE_VERSION
which node

# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Maintenance

### Updating Nix Dependencies

```bash
# Update flake.lock
nix flake update

# Or update specific input
nix flake update nixpkgs
```

### Workflow Modifications

When modifying `.github/workflows/copilot-runner-setup.yml`:

1. Test changes in a PR
2. Check GitHub Actions summary output
3. Verify test artifacts are uploaded correctly
4. Ensure startup summary is helpful for Copilot

## References

- [Nix Flakes](https://nixos.wiki/wiki/Flakes)
- [direnv](https://direnv.net/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Project Setup: SETUP_NIX_BIN.sh](../SETUP_NIX_BIN.sh)
- [Copilot Instructions: copilot-instructions.md](copilot-instructions.md)
