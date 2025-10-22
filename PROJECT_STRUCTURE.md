# SimCiv Project Structure

## Overview

This document provides an overview of the SimCiv project structure after the implementation of Version 0.0001 (Authentication System).

## Directory Structure

```
simciv/
├── .github/
│   └── copilot-instructions.md    # Coding guidelines for developers
├── designs/
│   └── version0.0001.md           # Authentication system design specification
├── docs/
│   └── AUTHENTICATION.md          # Authentication system documentation
├── public/
│   ├── index.html                 # Client UI for authentication
│   └── client.js                  # Client-side crypto and API calls
├── src/
│   ├── __tests__/
│   │   ├── helpers/
│   │   │   └── testDb.ts          # Test database utilities
│   │   ├── integration/
│   │   │   └── auth.test.ts       # End-to-end authentication tests
│   │   └── unit/
│   │       └── crypto.test.ts     # Unit tests for crypto utilities
│   ├── config/
│   │   └── index.ts               # Environment configuration
│   ├── db/
│   │   └── connection.ts          # MongoDB connection and collections
│   ├── middleware/
│   │   └── session.ts             # Session management middleware
│   ├── models/
│   │   └── types.ts               # TypeScript type definitions
│   ├── routes/
│   │   ├── auth.ts                # Authentication endpoints
│   │   └── session.ts             # Session status endpoints
│   ├── utils/
│   │   └── crypto.ts              # Cryptographic utilities
│   └── server.ts                  # Main Express server
├── .env.example                   # Example environment configuration
├── .gitignore                     # Git ignore rules
├── DESIGN_OPTIONS.md              # Design alternatives documentation
├── INITIAL_DESIGN.md              # Overall system architecture
├── LICENSE                        # GPL-3.0 license
├── README.md                      # Project overview and getting started
├── SECURITY.md                    # Security analysis and recommendations
├── VISION.md                      # Long-term project vision
├── jest.config.js                 # Jest testing configuration
├── package.json                   # Node.js dependencies and scripts
├── package-lock.json              # Locked dependency versions
└── tsconfig.json                  # TypeScript compiler configuration
```

## Key Files and Their Purpose

### Configuration Files

- **package.json**: Defines project dependencies and npm scripts
- **tsconfig.json**: TypeScript compiler settings (strict mode, ES2020 target)
- **jest.config.js**: Testing framework configuration
- **.env.example**: Template for environment variables
- **.gitignore**: Excludes node_modules, dist, coverage, etc.

### Source Code

#### Server (src/)

- **server.ts**: Main Express application, route registration, static file serving
- **config/index.ts**: Environment variable loading and configuration
- **db/connection.ts**: MongoDB connection, collection accessors, index creation
- **models/types.ts**: TypeScript interfaces for User, Session, Challenge
- **utils/crypto.ts**: Challenge generation, GUID creation, RSA encryption, key validation
- **middleware/session.ts**: Session creation, cookie management, authentication guard
- **routes/auth.ts**: Authentication endpoints (register, challenge, respond, logout)
- **routes/session.ts**: Session status endpoint

#### Client (public/)

- **index.html**: Authentication UI with registration and login forms
- **client.js**: Client-side cryptography (key generation, encryption, storage)

#### Tests (src/__tests__/)

- **unit/crypto.test.ts**: Tests for cryptographic utilities (15 tests)
- **integration/auth.test.ts**: End-to-end API tests (skipped in current environment)
- **helpers/testDb.ts**: MongoDB Memory Server setup for testing

### Documentation

- **README.md**: Project overview, current status, getting started guide
- **SECURITY.md**: Security analysis, CodeQL findings, production recommendations
- **AUTHENTICATION.md**: Complete authentication system documentation
- **INITIAL_DESIGN.md**: Database-centric architecture design
- **VISION.md**: Long-term project goals and features
- **DESIGN_OPTIONS.md**: Alternative designs considered
- **designs/version0.0001.md**: Detailed authentication system specification

### Developer Guidelines

- **.github/copilot-instructions.md**: Coding standards, architecture principles, common tasks

## Database Collections

The MongoDB database (default name: `simciv`) contains three collections:

### users
- Stores user accounts with alias, public key, status, timestamps
- Unique index on `alias` field

### sessions
- Tracks active sessions with GUID, state, expiration
- Indexes on `sessionGuid` (unique) and `expiresAt`

### challenges
- Temporary storage for authentication challenges
- Indexes on `alias` and `expiresAt`

## API Endpoints

### Authentication API (/api/auth)
- `POST /api/auth/check-alias` - Check alias availability
- `POST /api/auth/register` - Create new account
- `POST /api/auth/challenge` - Request authentication challenge
- `POST /api/auth/respond` - Submit challenge response
- `POST /api/auth/logout` - Terminate session

### Session API (/api/session)
- `GET /api/session/status` - Get current session state

### Application Routes
- `GET /` - Redirects to `/id={GUID}` with session cookie
- `GET /id={GUID}` - Serves client application

## NPM Scripts

```bash
npm run build         # Compile TypeScript to JavaScript (dist/)
npm run dev           # Development server with auto-reload
npm start             # Production server (requires npm run build first)
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## Technology Stack

- **Runtime**: Node.js 16+
- **Language**: TypeScript (strict mode)
- **Server**: Express.js
- **Database**: MongoDB 4.4+
- **Testing**: Jest with ts-jest
- **Client**: Vanilla JavaScript with Web Crypto API

## Security Features

- Challenge/response authentication
- RSA-OAEP encryption (2048-bit minimum)
- PBKDF2 key derivation (100,000 iterations)
- AES-GCM private key encryption
- HttpOnly, Secure, SameSite cookies
- Input validation on all endpoints
- No password storage or transmission

## Development Workflow

1. **Setup**: `npm install` to install dependencies
2. **Configure**: Copy `.env.example` to `.env` and adjust settings
3. **Run MongoDB**: Start MongoDB on localhost:27017
4. **Develop**: `npm run dev` for development server
5. **Test**: `npm test` to run tests
6. **Build**: `npm run build` to compile TypeScript
7. **Deploy**: `npm start` to run production server

## Next Steps

Future development areas (not yet implemented):

- Rate limiting middleware
- Account lockout mechanism
- Structured logging
- Simulation engine (Go)
- Game mechanics and UI
- Multi-device key management

See VISION.md for long-term roadmap and planned features.

## Related Documents

- [Authentication Design](designs/version0.0001.md) - Complete specification
- [Authentication Guide](docs/AUTHENTICATION.md) - Implementation documentation
- [Security Analysis](SECURITY.md) - Security findings and recommendations
- [Copilot Instructions](.github/copilot-instructions.md) - Development guidelines
- [System Architecture](INITIAL_DESIGN.md) - Overall design principles
