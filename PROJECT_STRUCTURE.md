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
├── client/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── Login.svelte       # Login component
│   │   │   └── Register.svelte    # Registration component
│   │   ├── utils/
│   │   │   ├── api.ts             # API client
│   │   │   ├── crypto.ts          # Cryptographic utilities
│   │   │   └── storage.ts         # Local storage management
│   │   ├── App.svelte             # Main application component
│   │   ├── main.ts                # Application entry point
│   │   └── app.css                # Global styles
│   └── index.html                 # HTML template
├── e2e/
│   └── auth.spec.ts               # Playwright E2E tests
├── public/                        # Built client files (generated)
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
├── playwright.config.ts           # Playwright configuration
├── svelte.config.js               # Svelte configuration
├── vite.config.ts                 # Vite build configuration
├── vitest.config.ts               # Vitest testing configuration
├── package.json                   # Node.js dependencies and scripts
├── package-lock.json              # Locked dependency versions
├── tsconfig.json                  # TypeScript compiler configuration
├── tsconfig.client.json           # TypeScript config for client
└── tsconfig.node.json             # TypeScript config for build tools
```

## Key Files and Their Purpose

### Configuration Files

- **package.json**: Defines project dependencies and npm scripts
- **tsconfig.json**: TypeScript compiler settings (strict mode, ES2020 target)
- **tsconfig.client.json**: TypeScript config for Svelte client
- **tsconfig.node.json**: TypeScript config for build tools
- **vitest.config.ts**: Vitest testing framework configuration
- **vite.config.ts**: Vite build configuration for client
- **playwright.config.ts**: Playwright E2E testing configuration
- **svelte.config.js**: Svelte preprocessor configuration
- **.env.example**: Template for environment variables
- **.gitignore**: Excludes node_modules, dist, public/, coverage, etc.

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

#### Client (client/)

- **src/App.svelte**: Main application component with auth state
- **src/lib/Register.svelte**: Registration form component
- **src/lib/Login.svelte**: Login form component
- **src/utils/crypto.ts**: Client-side cryptography (key generation, encryption, storage)
- **src/utils/storage.ts**: Local storage utilities with GUID namespacing
- **src/utils/api.ts**: API client for authentication endpoints
- **src/main.ts**: Application entry point
- **index.html**: HTML template for Svelte app

#### Tests (src/__tests__/ and e2e/)

- **unit/crypto.test.ts**: Tests for cryptographic utilities (15 tests with Vitest)
- **integration/auth.test.ts**: End-to-end API tests (skipped in current environment)
- **e2e/auth.spec.ts**: Playwright E2E tests for complete user flows
  - User registration and login
  - Cross-user isolation
  - Login after logout

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
npm run build         # Compile TypeScript and build client
npm run build:client  # Build Svelte client with Vite
npm start             # Production server (requires build first)
npm run dev           # Development server with auto-reload
npm run dev:client    # Development server for client (Vite dev server)
npm test              # Run unit tests with Vitest
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e      # Run Playwright E2E tests
```

## Technology Stack

- **Runtime**: Node.js 16+
- **Language**: TypeScript (strict mode)
- **Server**: Express.js
- **Database**: MongoDB 4.4+
- **Testing**: Vitest (unit tests), Playwright (E2E tests)
- **Client**: TypeScript + Svelte with Vite
- **Build Tool**: Vite

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
