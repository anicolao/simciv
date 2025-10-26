# SimCiv - A SimCity/Civilization Mashup

Welcome to **SimCiv**, an innovative strategy game that blends the city-building mechanics of SimCity with the grand strategy and competitive gameplay of Civilization.

## Overview

SimCiv reimagines the strategy game genre by putting you in the role of a civilization leader who sets broad goals and policies, while simulated citizens autonomously work to fulfill your vision. Rather than micromanaging every detail, you'll guide your civilization's development through high-level decisions, letting your simulated population handle the day-to-day execution.

## Concept

In SimCiv, you don't directly build every road, structure, or unit. Instead, you set priorities and goals for your civilization, and intelligent simulated humans respond to those directives. Your citizens will:

- **Build infrastructure** when they need better transportation and logistics
- **Establish trade routes** when economic growth is prioritized
- **Construct cities** as population grows and resources allow
- **Develop military forces** when defense or expansion is emphasized
- **Invest in science and culture** when knowledge and progress are valued

Each simulated human has their own desires, needs, and responses to your civilization's policies. They'll work collaboratively to achieve your stated objectives while adapting to the challenges they face.

## Gameplay

### Your Role as Leader

As the leader of your civilization, you'll:

- Set strategic priorities (military, economy, science, culture)
- Allocate resources and budgets
- Make policy decisions that influence citizen behavior
- Respond to events and opportunities
- Guide your civilization's technological advancement

### Simulated Citizens

Your civilization is built on the actions of simulated humans who:

- Respond to your priorities by investing their time and resources
- Build cities, libraries, workshops, and other structures based on needs
- Create trade networks and infrastructure
- Organize defense and exploration efforts
- Climb the technology ladder as resources allow

### Competition and Conquest

SimCiv is fundamentally competitive:

- **Compete with neighboring civilizations** for territory and resources
- **Race to claim unclaimed territory** before rivals do
- **Advance through technology trees** to unlock powerful capabilities
- **Engage in warfare, diplomacy, and trade** with other civilizations
- **Achieve victory** through various paths: military conquest, scientific superiority, cultural dominance, or economic might

### Technology and Progress

Technology is central to success in SimCiv:

- Progress through historical eras, from ancient times to the future
- Unlock new buildings, units, and capabilities
- Gain increasing rewards as you climb the tech ladder
- Balance immediate needs with long-term technological investment

## Game Philosophy

SimCiv is designed around several core principles:

1. **High-Level Strategy**: Focus on big-picture decisions rather than micromanagement
2. **Emergent Behavior**: Watch as complex civilizations emerge from simple citizen AI
3. **Organic Growth**: Cities and infrastructure develop naturally based on needs
4. **Competitive Multiplayer**: Civilizations compete for supremacy in a shared world
5. **Multiple Paths to Victory**: Success can be achieved through various strategies

## Current Status

SimCiv is in active development with two major milestones completed.

### Version 0.0002 - Game Creation System ✅

The second implementation milestone is complete:

- ✅ **Game Management**: Create, list, join, and view multiplayer games
- ✅ **Lobby System**: Browse available games with real-time updates
- ✅ **Auto-Start**: Games automatically start when player quota is met
- ✅ **Time Progression**: 1 year per real second, starting at 5000 BC
- ✅ **Go Simulation Engine**: Continuous tick processing for active games
- ✅ **Svelte UI**: Interactive game lobby with create/join functionality
- ✅ **Comprehensive Testing**: 50 passing tests (unit + integration)

See [docs/GAME_CREATION.md](docs/GAME_CREATION.md) for detailed documentation and [0.0002creategame.md](0.0002creategame.md) for the complete design specification.

### Version 0.0001 - Authentication System ✅

The first implementation milestone has been completed:

- ✅ **User Authentication**: Cryptographic challenge/response authentication system
- ✅ **Session Management**: GUID-based session tracking with MongoDB
- ✅ **Client-Side Security**: Private key encryption and local storage management
- ✅ **API Endpoints**: Complete REST API for authentication and session management
- ✅ **Testing**: Comprehensive unit tests for cryptographic operations
- ✅ **Documentation**: Full design specification and implementation guides

See [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) for detailed documentation and [designs/version0.0001.md](designs/version0.0001.md) for the complete design specification.

### Getting Started

#### Using Nix (NixOS/nix-darwin)

If you're on NixOS or macOS with nix-darwin, you can use Nix flakes to set up your development environment with all required tools:

```bash
# Enter the development shell with all tools installed
nix develop

# This will provide:
# - Node.js 20.x
# - Go 1.24.x
# - MongoDB 7.0
# - All other development dependencies

# Then follow the standard setup steps below
```

#### Using nix-bin with direnv (Ubuntu/Debian)

For a lighter-weight alternative on Ubuntu/Debian systems, you can use `nix-bin` from apt with direnv for automatic environment activation:

```bash
# Run the setup script
./SETUP_NIX_BIN.sh

# Log out and log back in for group membership to take effect

# Then allow direnv in the project directory
cd simciv
direnv allow

# The environment will be automatically loaded when you enter the directory

# Inside Nix: Build and test
npm install
npm run build
npm test

# OUTSIDE Nix: E2E tests (due to Playwright binary compatibility)
# Exit direnv environment first (e.g., cd /tmp && cd -)
e2e-setup
npm run test:e2e
```

**Important Note:** SimCiv uses a **two-tier development environment** where most work happens in Nix, but Playwright E2E tests must run outside Nix due to binary compatibility. See [docs/ENVIRONMENT_STRUCTURE.md](docs/ENVIRONMENT_STRUCTURE.md) for the complete explanation and [docs/DEVELOPMENT_RECIPES.md](docs/DEVELOPMENT_RECIPES.md) for quick-start commands.

For detailed setup instructions, see [docs/NIX_BIN_SETUP.md](docs/NIX_BIN_SETUP.md).

#### Standard Setup

To run SimCiv locally:

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start MongoDB (required)
# Note: If you're using the Nix flake on Linux, native MongoDB will be used automatically
# Otherwise, Docker will be used (make sure Docker is running)
./bin/mongo start

# Run development server
npm run dev

# In a separate terminal, start the Go simulation engine
cd simulation
go build -o simciv-sim main.go
./simciv-sim

# Access the application
# Navigate to http://localhost:3000
# Register/login, then create or join games!

# Run tests (requires MongoDB running on localhost:27017)
npm test

# Run Go tests
cd simulation && go test ./...

# Run E2E tests (requires running server and simulation engine)
npm run test:e2e
```

For more details:
- [Development Environment Setup](docs/DEVELOPMENT.md)
- [Authentication Documentation](docs/AUTHENTICATION.md)
- [Game Creation Documentation](docs/GAME_CREATION.md)

### Next Steps

We're building the foundation for simulated citizens, city development, and competitive gameplay. See [VISION.md](VISION.md) for details on the long-term goals and planned features.

## Contributing

Interested in contributing to SimCiv? We welcome contributors who are passionate about strategy games, simulation, and AI behavior. More details on contributing will be provided as the project develops.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

---

*SimCiv - Where strategy meets simulation*
