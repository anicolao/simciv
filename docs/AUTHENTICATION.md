# SimCiv Authentication System

This document describes the authentication system implementation for SimCiv (Version 0.0001).

## Overview

The authentication system uses cryptographic challenge/response authentication with client-side key management. This approach ensures passwords never leave the client and provides strong security guarantees.

## Key Features

- **User Accounts**: Alias-based accounts with no email requirement
- **Cryptographic Authentication**: Challenge/response using RSA 2048-bit keys
- **Client-Side Keys**: Private keys stored encrypted in browser local storage
- **GUID-Based Sessions**: Support for multiple users on the same browser
- **No Password Transmission**: Passwords only used for client-side key decryption
- **Stateful Sessions**: Server-side session tracking with MongoDB

## Getting Started

### Prerequisites

- Node.js 16+ 
- MongoDB 4.4+
- Modern browser with Web Crypto API support

### Installation

```bash
# Install dependencies
npm install

# Configure environment (optional)
cp .env.example .env
# Edit .env with your MongoDB connection string

# Build the application
npm run build
```

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` by default.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Architecture

### Server Components

```
src/
├── server.ts           # Main Express server
├── config/             # Configuration management
├── db/                 # MongoDB connection and schema
├── middleware/         # Session and auth middleware
├── routes/             # API endpoints
├── utils/              # Cryptographic utilities
└── models/             # TypeScript type definitions
```

### Client Components

```
public/
├── index.html          # Authentication UI
└── client.js           # Client-side crypto and API calls
```

## API Endpoints

### Authentication

#### Check Alias Availability
```
POST /api/auth/check-alias
Body: { "alias": "username" }
Response: { "available": true }
```

#### Register New Account
```
POST /api/auth/register
Body: { 
  "alias": "username",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n..."
}
Response: { "success": true, "alias": "username" }
```

#### Request Authentication Challenge
```
POST /api/auth/challenge
Body: { "alias": "username" }
Response: { 
  "challengeId": "uuid",
  "encryptedChallenge": "base64..."
}
```

#### Submit Challenge Response
```
POST /api/auth/respond
Body: { 
  "challengeId": "uuid",
  "response": "decrypted-challenge"
}
Response: { "success": true, "alias": "username" }
```

#### Logout
```
POST /api/auth/logout
Response: { "success": true }
```

### Session Management

#### Get Session Status
```
GET /api/session/status
Response: {
  "sessionGuid": "uuid",
  "state": "authenticated",
  "userId": "username",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "expiresAt": "2024-01-01T01:00:00.000Z"
}
```

### Session URLs

- `GET /` - Redirects to `/id={GUID}` with session cookie
- `GET /id={GUID}` - Serves the client application

## Authentication Flow

### Registration

1. User enters alias and password in UI
2. Client generates RSA 2048-bit key pair
3. Client encrypts private key with password-derived key (PBKDF2)
4. Client stores encrypted private key in local storage (GUID-namespaced)
5. Client sends public key and alias to server
6. Server validates and stores user account
7. Session becomes authenticated

### Login

1. User enters alias and password in UI
2. Client sends alias to server
3. Server generates random challenge
4. Server encrypts challenge with user's public key
5. Server sends encrypted challenge to client
6. Client decrypts challenge using stored private key
7. Client sends decrypted challenge to server
8. Server validates response and authenticates session

## Security Features

### Cryptographic Protection

- **RSA-OAEP**: Public key encryption with SHA-256
- **AES-GCM**: Private key encryption with 256-bit keys
- **PBKDF2**: Key derivation with 100,000 iterations
- **Random Challenges**: 32 bytes of cryptographically secure random data

### Session Security

- **HttpOnly Cookies**: Prevents XSS theft
- **Secure Flag**: HTTPS-only in production
- **SameSite**: CSRF protection
- **Short TTL**: Challenges expire in 5 minutes
- **Single Use**: Challenges can only be used once

### Data Protection

- No passwords stored server-side
- Private keys never leave the client
- Public keys stored server-side for challenge encryption
- GUID-based storage isolation for multi-user support

## Configuration

Environment variables (`.env`):

```bash
PORT=3000
MONGO_URI=mongodb://localhost:27017
DB_NAME=simciv
CHALLENGE_TTL_MINUTES=5
SESSION_IDLE_TIMEOUT_MINUTES=60
SESSION_ABSOLUTE_TIMEOUT_MINUTES=1440
NODE_ENV=development
```

## Database Schema

### users collection
```typescript
{
  alias: string;              // Unique username
  publicKey: string;          // RSA public key in PEM format
  accountStatus: string;      // 'active' | 'suspended' | 'deleted'
  createdAt: Date;           // Account creation timestamp
  lastLoginAt?: Date;        // Last successful login
}
```

### sessions collection
```typescript
{
  sessionGuid: string;        // Unique session identifier (UUID)
  userId?: string;           // Associated user alias
  state: string;             // 'unauthenticated' | 'authenticating' | 'authenticated'
  createdAt: Date;           // Session creation timestamp
  lastAccessAt: Date;        // Last activity timestamp
  expiresAt: Date;           // Session expiration
  ipAddress?: string;        // Client IP (optional)
  userAgent?: string;        // Browser user agent (optional)
}
```

### challenges collection
```typescript
{
  challengeId: string;        // Unique challenge identifier (UUID)
  alias: string;             // Associated user alias
  challenge: string;         // Plain challenge text
  encryptedChallenge: string; // RSA-encrypted challenge
  createdAt: Date;           // Challenge creation timestamp
  expiresAt: Date;           // Challenge expiration
  used: boolean;             // Whether challenge has been used
}
```

## Client-Side Storage

Data is stored in browser local storage with GUID namespacing:

```javascript
// Private key storage
localStorage.setItem('simciv_{GUID}_privatekey', JSON.stringify({
  encryptedKey: [...],      // Encrypted private key bytes
  salt: [...],              // PBKDF2 salt
  iv: [...],                // AES-GCM IV
  algorithm: 'AES-GCM',
  keyDerivation: {
    function: 'PBKDF2',
    iterations: 100000,
    hash: 'SHA-256'
  },
  version: 1,
  createdAt: '2024-01-01T00:00:00.000Z'
}));

// User alias
localStorage.setItem('simciv_{GUID}_alias', 'username');
```

## Browser Compatibility

- Chrome/Edge 79+
- Firefox 78+
- Safari 14+
- Opera 66+

Requirements:
- Web Crypto API support
- Local Storage API
- ES6+ JavaScript features

## Troubleshooting

### "Invalid public key format"
- Ensure key is RSA with minimum 2048 bits
- Check PEM format with proper headers

### "Challenge expired"
- Challenges expire after 5 minutes
- Request a new challenge and respond quickly

### "No private key found"
- Each browser session has its own GUID
- You need to register/login on each new session
- Check the GUID in the URL matches your local storage

### "Wrong password"
- Password is used to decrypt the stored private key
- Must match the password used during registration
- Case-sensitive

## Development

### Adding New Features

1. Review design document in `designs/version0.0001.md`
2. Follow coding guidelines in `.github/copilot-instructions.md`
3. Write tests before implementation
4. Update documentation

### Code Style

- TypeScript strict mode
- Async/await for asynchronous operations
- Explicit error handling
- Descriptive variable names
- JSDoc comments for public functions

## Related Documentation

- [Design Specification](../designs/version0.0001.md) - Complete authentication system design
- [Copilot Instructions](../.github/copilot-instructions.md) - Development guidelines
- [Initial Design](../INITIAL_DESIGN.md) - Overall system architecture

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](../LICENSE) file for details.
