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

SimCiv is currently in early development. 

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

To run the authentication system locally:

```bash
# Install dependencies
npm install

# Start MongoDB (required)
# Use Docker: docker run -d -p 27017:27017 mongo:latest
# Or install locally

# Run development server
npm run dev

# Access the application
# Navigate to http://localhost:3000
```

For more details, see the [Authentication Documentation](docs/AUTHENTICATION.md).

### Next Steps

We're building the foundation for simulated citizens, city development, and competitive gameplay. See [VISION.md](VISION.md) for details on the long-term goals and planned features.

## Contributing

Interested in contributing to SimCiv? We welcome contributors who are passionate about strategy games, simulation, and AI behavior. More details on contributing will be provided as the project develops.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

---

*SimCiv - Where strategy meets simulation*
