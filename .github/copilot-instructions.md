# GitHub Copilot Instructions for SimCiv

## Project Overview

SimCiv is a strategy game combining city-building mechanics with grand strategy gameplay. The project uses a database-centric architecture with clear separation between client, server, and simulation components.

## Technology Stack

- **Server**: Node.js with TypeScript and Express
- **Database**: MongoDB (production) / MongoDB Memory Server (tests)
- **Client**: TypeScript + Svelte with Vite
- **Simulation**: Go (future implementation)
- **Testing**: Vitest for unit tests, Playwright for E2E tests

## Architecture Principles

1. **Database as Single Source of Truth**: All game state and user actions are stored in MongoDB
2. **Complete Modularity**: Simulation engine and clients are independent modules
3. **Security First**: Cryptographic challenge/response authentication, no password transmission
4. **Privacy-Preserving**: Client-side key storage, minimal data collection
5. **Follow Existing Patterns**: When unsure about how to implement something, examine prior completed PRs to understand established patterns and follow them. Do not ask questions about processes that have already been demonstrated in previous work.

## Authentication System (Version 0.0001)

The current implementation includes:

### Server-Side Components
- **Database Collections**:
  - `users`: Stores alias, publicKey, accountStatus, timestamps
  - `sessions`: GUID-based session tracking with state management
  - `challenges`: Temporary challenge storage for authentication

- **API Endpoints**:
  - `POST /api/auth/check-alias`: Check alias availability
  - `POST /api/auth/register`: Create new account with public key
  - `POST /api/auth/challenge`: Request authentication challenge
  - `POST /api/auth/respond`: Submit challenge response
  - `POST /api/auth/logout`: Terminate session
  - `GET /api/session/status`: Get current session state

- **Session Management**:
  - `GET /`: Redirects to `/id={GUID}` with session cookie
  - `GET /id={GUID}`: Serves client application with session context

### Client-Side Components
- **Key Management**:
  - RSA 2048-bit key pair generation using Web Crypto API
  - Password-based private key encryption with PBKDF2 (100,000 iterations)
  - GUID-namespaced local storage for multi-user support

- **Authentication Flow**:
  1. Registration: Generate keys, encrypt private key, send public key to server
  2. Login: Request challenge, decrypt with private key, submit response
  3. Session: Maintain GUID-based session across page loads

### Security Features
- No password transmission to server
- Challenge/response authentication prevents replay attacks
- RSA-OAEP encryption with SHA-256
- AES-GCM for private key storage
- HttpOnly, Secure, SameSite cookies
- Single-use challenges with 5-minute TTL

## Coding Guidelines

### TypeScript Style
- Use strict mode TypeScript
- Explicit return types for functions
- Prefer interfaces over types for object shapes
- Use async/await over promises
- Handle errors explicitly with try-catch

### Database Operations
- Always use the collection accessors from `db/connection.ts`
- Create indexes for frequently queried fields
- Use timestamps (Date objects) for all time-related fields
- Validate input before database operations

### API Design
- RESTful endpoints with clear HTTP methods
- Return JSON responses with appropriate status codes
- Use middleware for cross-cutting concerns (session, auth)
- Validate all input data
- Return descriptive error messages

### Security Best Practices
- Validate public key format and strength (minimum 2048-bit RSA)
- Use crypto.randomBytes and crypto.randomUUID for random generation
- Never log sensitive data (passwords, private keys, challenges)
- Implement rate limiting for authentication endpoints
- Mark challenges as used after validation

### Testing
- Write unit tests with Vitest for utility functions
- Write E2E tests with Playwright for user flows
- Mock database connections in tests
- Test both success and failure cases
- Test edge cases (expired challenges, duplicate aliases, etc.)
- Use descriptive test names

**CRITICAL TESTING REQUIREMENTS:**
- **PASSING TESTS ARE MANDATORY** - All tests must pass before PR completion
- **NO SKIPPED TESTS** - Tests marked as `.skip()` must be fixed, not left skipped
- **NO FAILING TESTS** - Fix all test failures before completion  
- **NO EXCEPTIONS FOR COMPLEXITY** - "Too complex" is not a valid reason to skip tests
- **ALWAYS run all unit and integration tests before completing a PR**
- **ALWAYS run Playwright E2E tests (`npm run test:e2e`) before completing a PR**
- **DELETING TESTS IS GENERALLY UNACCEPTABLE** - Only remove tests if they're truly obsolete
- Use `TEST_MONGO_URI` environment variable to run integration tests with external MongoDB when mongodb-memory-server has issues
- Integration tests must pass before PR completion
- **E2E tests must be run and screenshots must be generated and committed** whenever new e2e tests are added

**PLAYWRIGHT E2E TESTING REQUIREMENTS:**
- **ALWAYS run Playwright E2E tests (`npm run test:e2e`) whenever you add or modify e2e test files**
- **ALWAYS commit the generated screenshot PNG files** after running e2e tests
- **E2E tests must validate end-to-end functionality including UI interactions**
- **Screenshots must be captured at key UI states** to verify layout and prevent visual regressions
- **All E2E tests must pass** - No skipped or failing tests
- **Screenshots must use numbered filenames** that continue the existing narrative sequence (e.g., if last screenshot is 18-*.png, new ones start at 19-*.png)
- **Screenshots document the complete user workflow** from authentication through all features
- Screenshots should be taken for:
  - Initial page load and authentication forms
  - Form validation states (errors, success messages)
  - Authenticated user states
  - Critical user workflows (registration, login, logout, game creation, map viewing, etc.)
  - New features or UI changes
- **Review screenshots** to ensure UI layout is correct and no visual bugs are introduced
- **Update e2e-screenshots/README.md** to document new screenshots when adding them
- **Use the proper authentication pattern**: Follow the `registerAndLogin()` helper pattern from existing tests (auth.spec.ts, game-creation.spec.ts)
- **Do NOT manually set cookies or database records** - use the actual UI flow instead
- **Use `page.context().clearCookies()`** to switch between different users in tests

## How to Run E2E Tests

### Prerequisites
1. MongoDB running: `bin/mongo start`
2. Simulation engine: `cd simulation && go build && ./simulation &`
3. Web server: `npm run build && npm start &`

### Running E2E Tests
```bash
# Run all e2e tests with timeout
timeout 180 npx playwright test e2e/ 2>&1 | tail -100

# Run specific test file
timeout 180 npx playwright test e2e/map-view.spec.ts 2>&1 | tail -100

# Debug mode (headed browser)
npx playwright test e2e/ --headed --debug
```

### Common Issues
- Browsers not installed: `npx playwright install chromium`
- Tests timeout: Increase timeout or check services are running
- Authentication fails: Verify session cookies are being set correctly
- Screenshots blank: Wait for elements to be visible before capturing

### File Organization
```
src/
├── config/          # Configuration and environment variables
├── db/              # Database connection and schema
├── middleware/      # Express middleware (session, auth)
├── models/          # TypeScript interfaces and types
├── routes/          # API route handlers
├── utils/           # Utility functions (crypto, etc.)
├── __tests__/
│   ├── unit/        # Unit tests for utilities
│   ├── integration/ # End-to-end API tests
│   └── helpers/     # Test utilities
└── server.ts        # Main server entry point

public/              # Static client files
├── index.html       # Client UI
└── client.js        # Client-side logic

designs/             # Design documentation
├── version0.0001.md # Authentication system design
├── MAP_GENERATION.md # Map generation design
└── ...              # Other design specifications
```

### Documentation Organization
- **ALL design documents MUST be placed in the `designs/` folder**
- Design documents should follow the established format (see existing designs)
- Include version number, status, purpose, and last updated date
- Reference related design documents in the "Related Documents" section
- Keep root-level markdown files for project-wide documentation only (README, VISION, etc.)

## Common Tasks

### Adding a New API Endpoint
1. Create handler in appropriate route file (e.g., `src/routes/auth.ts`)
2. Use session middleware if authentication required
3. Validate input parameters
4. Perform database operations using collection accessors
5. Return appropriate HTTP status codes
6. Add unit tests in `src/__tests__/unit/`
7. Document the endpoint in code comments

### Adding a New Database Collection
1. Define TypeScript interface in `src/models/types.ts`
2. Add collection accessor in `src/db/connection.ts`
3. Create necessary indexes in `connectToDatabase()`
4. Update any affected routes or services

### Modifying Authentication Flow
1. Review `designs/version0.0001.md` for design constraints
2. Update both server-side (TypeScript) and client-side (JavaScript) code
3. Maintain backward compatibility if possible
4. Update tests to cover new scenarios
5. Document security implications

## Environment Variables

```
PORT=3000
MONGO_URI=mongodb://localhost:27017
DB_NAME=simciv
CHALLENGE_TTL_MINUTES=5
SESSION_IDLE_TIMEOUT_MINUTES=60
SESSION_ABSOLUTE_TIMEOUT_MINUTES=1440
NODE_ENV=development
```

## Running the Application

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Run E2E tests (requires MongoDB)
npm run test:e2e

# Build TypeScript
npm run build

# Start development server
npm run dev

# Start production server
npm start
```

## Future Development

When extending the codebase:

1. **Simulation Engine (Go)**: Will read/write to MongoDB independently
2. **Advanced Client**: Consider Svelte/SvelteKit for richer UI
3. **Key Rotation**: Implement user-initiated key rotation
4. **Session Cleanup**: Add periodic job to purge expired sessions
5. **Rate Limiting**: Add rate limiting middleware for auth endpoints
6. **Audit Logging**: Log security events for monitoring

## Important Notes

- Never commit secrets or credentials
- Always use HTTPS in production
- Keep dependencies updated for security patches
- Follow the principle of least privilege
- Document breaking changes in commit messages
- Reference `designs/version0.0001.md` for authentication specifications

## Design Documents

All major design decisions are documented in the `designs/` directory:
- `designs/version0.0001.md`: Complete authentication system specification

Consult these documents before making architectural changes.
