# SimCiv Development Recipes

Quick reference for common development tasks.

## Setup

```bash
# Clone and enter the project
git clone https://github.com/anicolao/simciv.git
cd simciv

# Allow direnv (first time only)
direnv allow
```

## Daily Development

### Start Your Work Session

```bash
# Navigate to project (direnv activates Nix automatically)
cd simciv

# Verify environment loaded
which node    # Should show /nix/store/.../bin/node
node --version # Should show v20.x
```

### Build and Run

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

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run Go tests
cd simulation
go test ./...

# Run E2E tests
npm run test:e2e
```

## Quick Troubleshooting

### "Command not found" errors

```bash
# Verify you're in the Nix environment
echo $IN_NIX_SHELL  # Should output "1"

# If not, navigate to project directory
cd simciv  # direnv should activate
```

### MongoDB won't start

```bash
# Check MongoDB status
mongo status

# Restart MongoDB
mongo restart
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

```bash
# Check environment variable
echo $IN_NIX_SHELL  # "1" if in Nix

# Verify all tools are available
node --version  # v20.x
go version      # go1.25.x
mongod --version # db version v7.0.x
npm --version   # 10.x
```

## Common Workflows

### Full Clean Build

```bash
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
npm test
cd simulation && go test ./...
npm run test:e2e
```

### Develop New Feature

```bash
# Start MongoDB and dev server
mongo start
npm run dev  # Terminal 1

# Start simulation engine
cd simulation && ./simciv-sim  # Terminal 2

# Run tests in watch mode
npm run test:watch  # Terminal 3

# Make your changes...
# Tests re-run automatically on file save
```

## Related Documentation

- [DEVELOPMENT.md](DEVELOPMENT.md) - General development setup

---

**TL;DR:**
- `direnv` makes Nix activation automatic when you `cd simciv`
- All development commands work in the Nix environment
