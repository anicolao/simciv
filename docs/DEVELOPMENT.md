# Development Environment Setup

This document describes how to set up your development environment for SimCiv.

## Prerequisites

SimCiv requires the following tools:

- **Node.js 20.x** - for the server and client application
- **npm** - Node.js package manager (comes with Node.js)
- **Go 1.24+** - for the simulation engine
- **MongoDB 7.0** - database for game state and user data
- **Git** - version control

## Setup Options

### Option 1: Nix (Recommended for NixOS/nix-darwin users)

If you're using NixOS or macOS with nix-darwin, you can use our Nix flake to automatically set up all required tools:

```bash
# Clone the repository
git clone https://github.com/anicolao/simciv.git
cd simciv

# Enter the development environment
nix develop

# This will automatically install and configure:
# - Node.js 20.x
# - Go (latest stable)
# - MongoDB 7.0
# - Git and other development tools

# The flake also sets up environment variables:
# - MONGO_URI=mongodb://localhost:27017
# - DB_NAME=simciv
# - PORT=3000
```

#### Using direnv (Optional)

If you have [direnv](https://direnv.net/) installed, the repository includes a `.envrc` file that will automatically load the Nix environment when you enter the directory:

```bash
# Allow direnv for this directory
direnv allow

# The environment will now load automatically when you cd into the directory
cd simciv  # Environment loads automatically
```

#### Customizing the Nix Environment

The `flake.nix` file can be customized to your needs:

- **Docker support**: Uncomment the `docker` and `docker-compose` lines if you prefer running MongoDB in Docker
- **Additional tools**: Add any additional packages from nixpkgs to the `buildInputs` list

### Option 2: Manual Installation

If you're not using Nix, install the prerequisites manually:

#### macOS

```bash
# Install Homebrew if you haven't already
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install node@20
brew install go
brew install mongodb-community@7.0

# Start MongoDB service
brew services start mongodb-community@7.0
```

#### Ubuntu/Debian

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Go
wget https://go.dev/dl/go1.24.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.24.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Install MongoDB
sudo apt-get install gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
```

#### Using Docker for MongoDB

If you prefer to run MongoDB in a container:

```bash
docker run -d --name simciv-mongo -p 27017:27017 mongo:7.0
```

## Building and Running

Once your environment is set up:

```bash
# Install Node.js dependencies
npm install

# Build TypeScript and client code
npm run build

# Start the development server (with auto-reload)
npm run dev

# In a separate terminal, build and run the Go simulation engine
cd simulation
go build -o simciv-sim main.go
./simciv-sim

# The application will be available at http://localhost:3000
```

## Testing

SimCiv has comprehensive test coverage:

```bash
# Run all unit tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with external MongoDB (if mongodb-memory-server has issues)
TEST_MONGO_URI="mongodb://localhost:27017" npm test

# Run Go tests
cd simulation && go test ./...

# Run end-to-end tests (requires server and simulation engine running)
npm run test:e2e
```

## Development Workflow

### Server Development

The server uses `nodemon` for automatic reloading:

```bash
npm run dev
```

This watches for changes in `src/**/*.ts` and automatically restarts the server.

### Client Development

For rapid client development with hot module replacement:

```bash
npm run dev:client
```

This starts Vite's development server on port 5173 with hot reloading for the Svelte client.

### Simulation Engine Development

The Go simulation engine must be rebuilt after changes:

```bash
cd simulation
go build -o simciv-sim main.go
./simciv-sim
```

For active development, you might want to use a file watcher like `entr`:

```bash
find . -name "*.go" | entr -r go run main.go
```

## Environment Variables

Create a `.env` file in the project root (see `.env.example` for reference):

```bash
# Server configuration
PORT=3000
MONGO_URI=mongodb://localhost:27017
DB_NAME=simciv

# Session configuration
SESSION_IDLE_TIMEOUT_MINUTES=60
SESSION_ABSOLUTE_TIMEOUT_MINUTES=1440
CHALLENGE_TTL_MINUTES=5

# Development
NODE_ENV=development
```

## IDE Setup

### VS Code

Recommended extensions:
- ESLint
- Prettier
- Svelte for VS Code
- Go

### IntelliJ IDEA / WebStorm

Enable:
- TypeScript support
- Svelte support
- Go plugin

## Troubleshooting

### MongoDB Memory Server Issues

If you encounter download issues with `mongodb-memory-server` during tests:

```bash
# Use external MongoDB for tests
TEST_MONGO_URI="mongodb://localhost:27017" npm test
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Change the port
PORT=3001 npm run dev
```

### Go Module Issues

If you encounter Go module problems:

```bash
cd simulation
go mod tidy
go mod download
```

## Additional Resources

- [Authentication Documentation](AUTHENTICATION.md)
- [Game Creation Documentation](GAME_CREATION.md)
- [Project Structure](../PROJECT_STRUCTURE.md)
- [Vision and Roadmap](../VISION.md)
