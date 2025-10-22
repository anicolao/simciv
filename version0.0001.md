# SimCiv Version 0.0001 Design Specification
## User Authentication and Session Management

### Document Status
**Version:** 0.0001  
**Status:** Design Review  
**Last Updated:** 2025-10-22  
**Purpose:** Specification for user account creation, authentication, and session management

---

## Executive Summary

This document specifies the design for SimCiv's initial user authentication and session management system. The design emphasizes security through cryptographic challenge/response authentication, privacy-preserving client-side key storage, and flexible multi-user support within a single browser environment.

**Key Features:**
- User-defined aliases and passwords
- Cryptographic challenge/response authentication
- Client-side key generation and storage
- Password-protected private key storage
- Server-side GUID-based session tracking
- Multi-user browser support through GUID-based storage separation

This design aligns with the database-centric architecture defined in INITIAL_DESIGN.md, maintaining clear separation between client presentation, server logic, and persistent storage.

---

## Architecture Context

This authentication system integrates with the existing SimCiv architecture:
- **Database Layer**: Stores user accounts, public keys, and session data
- **Server Layer**: Manages session lifecycle, generates challenges, validates responses
- **Client Layer**: Generates keys, manages local storage, handles user interface

The design maintains the principle of database as single source of truth while leveraging client-side cryptography for secure, stateless authentication.

---

## System Overview

### Authentication Flow High-Level

1. **Account Creation**: User selects alias and password; client generates key pair
2. **Key Registration**: Client sends public key to server with alias
3. **Session Initiation**: Server generates GUID for new sessions
4. **Challenge Generation**: Server encrypts random challenge with user's public key
5. **Response Validation**: Client decrypts with private key, sends response
6. **Session Establishment**: Server validates response, issues session cookie

### Multi-User Browser Support

The system supports multiple users on the same browser through:
- Unique GUID per browser session
- GUID-based storage namespacing in local storage
- Cookie-based GUID persistence across page loads
- Session-specific state isolation

---

## User Account System

### Account Structure

Each user account consists of:
- **Alias**: User-chosen identifier (username)
  - Must be unique across the system
  - No format restrictions beyond basic validation
  - Case-sensitive storage, case-insensitive lookup option
  - Serves as primary user identifier

- **Password**: User-chosen authentication secret
  - Never transmitted to server
  - Used only for client-side key decryption
  - No server-side password storage or validation
  - Strength requirements configurable but not enforced server-side

- **Public Key**: Cryptographic public key
  - Generated client-side during registration
  - Stored server-side for challenge generation
  - Associated with user alias in database
  - Used for challenge encryption

### Account Creation Process

**User Perspective:**
1. Navigate to registration interface
2. Enter desired alias
3. Enter password (with confirmation)
4. Submit registration

**Client-Side Operations:**
1. Validate alias uniqueness via server check
2. Generate RSA key pair (or equivalent asymmetric algorithm)
3. Encrypt private key using password-derived key
4. Store encrypted private key in GUID-namespaced local storage
5. Send public key and alias to server

**Server-Side Operations:**
1. Validate alias availability
2. Validate public key format and properties
3. Store alias and public key in database
4. Return success confirmation
5. Initiate session for newly created account

### Account Data Persistence

**Database Schema Considerations:**
- User accounts collection/table
  - alias (unique, indexed)
  - publicKey (text/blob)
  - createdAt (timestamp)
  - lastLoginAt (timestamp)
  - accountStatus (active/suspended/deleted)

**Client-Side Storage:**
- Encrypted private key in local storage
- Keyed by GUID to support multiple users
- Contains metadata (key format, encryption version)

---

## Cryptographic Challenge/Response Authentication

### Design Rationale

Traditional password authentication transmits secrets over the network, creating vulnerability windows. Challenge/response authentication proves identity without transmitting sensitive information.

**Benefits:**
- Password never leaves client
- Replay attacks prevented through random challenges
- Compromise of server database doesn't expose credentials
- Forward secrecy through ephemeral challenges

### Authentication Protocol

**Phase 1: Challenge Request**

Client initiates authentication:
1. User enters alias and password
2. Client sends alias to server
3. Server looks up public key for alias

**Phase 2: Challenge Generation**

Server creates authentication challenge:
1. Generate random challenge string (high entropy)
2. Store challenge temporarily with timestamp and alias
3. Encrypt challenge using user's public key
4. Send encrypted challenge to client

Challenge properties:
- Sufficient length for security (minimum 32 bytes)
- Cryptographically random generation
- Short time-to-live (configurable, suggested 5 minutes)
- Single-use only

**Phase 3: Challenge Response**

Client proves identity:
1. Retrieve encrypted private key from GUID-namespaced storage
2. Derive decryption key from user password
3. Decrypt private key
4. Decrypt challenge using private key
5. Send decrypted challenge back to server

**Phase 4: Response Validation**

Server validates identity:
1. Retrieve stored challenge for alias
2. Verify challenge not expired
3. Compare received response with original challenge
4. Mark challenge as used (prevent replay)
5. Create authenticated session on match
6. Return authentication failure on mismatch

### Security Properties

**Protection Against:**
- **Network Sniffing**: Encrypted challenge, no password transmission
- **Replay Attacks**: Single-use challenges with expiration
- **Database Compromise**: No server-side password storage
- **Brute Force**: Client-side key derivation rate limiting
- **Rainbow Tables**: No password hashes to attack

**Cryptographic Requirements:**
- Asymmetric encryption algorithm (RSA 2048+ or equivalent)
- Secure random number generation for challenges
- Key derivation function for password-to-key conversion (PBKDF2, Argon2, or scrypt)
- Sufficient key stretching iterations for password protection

---

## Client-Side Key Management

### Key Generation

**Timing:**
- Generated during account registration
- Regenerated only on explicit user request (key rotation)
- Never generated server-side

**Algorithm Selection:**
- RSA with minimum 2048-bit keys, or
- Elliptic Curve Cryptography with equivalent security
- Algorithm choice affects challenge encryption method

**Key Generation Process:**
1. Initialize cryptographic random number generator
2. Generate asymmetric key pair using selected algorithm
3. Verify key pair validity
4. Extract public key for server transmission
5. Prepare private key for encrypted storage

### Private Key Storage

**Storage Location:**
- Browser local storage
- Keyed by session GUID for multi-user support
- Persistent across browser sessions

**Storage Structure:**
```
localStorage key format:
  "simciv_privatekey_{GUID}"

Storage value structure:
  {
    encryptedKey: <encrypted private key data>,
    algorithm: <encryption algorithm identifier>,
    keyDerivation: {
      function: <KDF name>,
      iterations: <iteration count>,
      salt: <unique salt for this key>
    },
    version: <encryption scheme version>,
    createdAt: <timestamp>
  }
```

**Encryption Process:**
1. Generate unique random salt
2. Derive encryption key from user password using KDF
   - Input: password + salt
   - Output: symmetric encryption key
   - Function: PBKDF2/Argon2/scrypt with high iteration count
3. Encrypt private key with derived symmetric key
   - Algorithm: AES-256 or equivalent
   - Mode: GCM or CBC with authentication
4. Store encrypted key with metadata

**Decryption Process:**
1. Retrieve encrypted key from GUID-namespaced storage
2. Extract salt and KDF parameters
3. Derive encryption key from user password
4. Decrypt private key
5. Verify key integrity
6. Use for challenge decryption
7. Clear from memory after use

### Key Security Considerations

**Password-Based Protection:**
- Private key encrypted at rest
- Password required for every authentication
- No persistent decrypted key storage
- Secure memory handling during key use

**Storage Security:**
- Local storage accessible only to same-origin scripts
- GUID namespacing prevents cross-user key access
- Encryption protects against local storage compromise
- Salt prevents rainbow table attacks on password

**Key Lifecycle:**
- Generated once at registration
- Used repeatedly for authentication
- Rotatable on user request or security policy
- Deletable when account closed or key compromised

---

## Server-Side Session Management

### Session Lifecycle

**Session Creation:**
- Triggered when user first accesses application
- Generated on root path access
- Persists across authenticated and unauthenticated states

**Session States:**
- **Unauthenticated**: Fresh session, no user identity
- **Authenticating**: Challenge issued, awaiting response
- **Authenticated**: User identity verified
- **Expired**: Session timeout reached
- **Terminated**: Explicitly logged out

### GUID-Based Session Tracking

**GUID Properties:**
- Globally unique identifier for each session
- Generated using cryptographic random source
- Sufficient length to prevent guessing (UUID v4 or equivalent)
- Immutable for session lifetime

**GUID Generation:**
- Created on first visit to root path
- Generated server-side using secure random
- Format: standard UUID (e.g., "550e8400-e29b-41d4-a716-446655440000")
- Validated for uniqueness before use

**Session Storage:**

Database schema for sessions:
- sessionGuid (primary key, indexed)
- userId (nullable, references user account)
- createdAt (timestamp)
- lastAccessAt (timestamp)
- expiresAt (timestamp)
- state (unauthenticated/authenticating/authenticated/expired/terminated)
- ipAddress (optional, for security monitoring)
- userAgent (optional, for session identification)

### Root Path Redirection

**First Visit Behavior:**
1. User accesses root path "/"
2. Server generates new GUID
3. Server creates session record in database
4. Server sets GUID cookie on response
5. Server redirects to "/id={GUID}"
6. Client lands on GUID-specific URL

**Subsequent Visit Behavior:**
1. User accesses root path "/" with existing cookie
2. Server reads GUID from cookie
3. Server validates GUID exists and is valid
4. Server redirects to "/id={GUID}"
5. Client resumes session at GUID-specific URL

**Direct GUID URL Access:**
- Accessing "/id={GUID}" directly with matching cookie: normal operation
- Accessing "/id={GUID}" without cookie: set cookie, continue
- Accessing "/id={GUID}" with mismatched cookie: security decision needed
  - Option A: Redirect to cookie's GUID (cookie wins)
  - Option B: Update cookie to URL's GUID (URL wins)
  - Option C: Clear cookie, regenerate (security-first)

### Cookie Management

**Cookie Properties:**
- Name: "simciv_session" or similar
- Value: Session GUID
- HttpOnly: true (prevents JavaScript access)
- Secure: true (HTTPS only in production)
- SameSite: Lax or Strict (CSRF protection)
- Path: "/"
- MaxAge: Session duration or browser session

**Cookie Lifecycle:**
1. Set on session creation (root redirect)
2. Sent with every request to domain
3. Updated on authentication state change
4. Cleared on explicit logout
5. Expires based on policy (idle timeout or absolute timeout)

**Cookie Security:**
- Prevents CSRF through SameSite attribute
- Prevents XSS theft through HttpOnly flag
- Encrypted in transit through Secure flag
- Rotatable on security events

### Session Persistence

**Session Duration Policies:**
- **Idle Timeout**: Configurable period of inactivity
- **Absolute Timeout**: Maximum session lifetime
- **Remember Me**: Extended duration option
- **Immediate Expiry**: On explicit logout

**Session Renewal:**
- Update lastAccessAt on each request
- Extend expiresAt based on idle timeout policy
- Allow authenticated session to persist across browser restarts
- Require re-authentication after absolute timeout

**Session Cleanup:**
- Periodic purge of expired sessions from database
- Cleanup of associated temporary data (challenges)
- Audit logging of session lifecycle events

---

## Client-Side Storage Management

### GUID-Based Namespace Separation

**Purpose:**
Enable multiple users to use the same browser without state collision.

**Mechanism:**
All local storage keys prefixed with session GUID:
- "simciv_{GUID}_privatekey"
- "simciv_{GUID}_preferences"
- "simciv_{GUID}_gamestate"
- "simciv_{GUID}_cache"

**Benefits:**
- Complete isolation between user sessions
- Parallel logins in different tabs possible
- Clean separation of user data
- Simple cleanup when session ends

### Storage Structure

**Per-GUID Storage:**
```
Local Storage Organization:
  simciv_{GUID}_privatekey: {encrypted private key}
  simciv_{GUID}_alias: {user alias}
  simciv_{GUID}_preferences: {user preferences}
  simciv_{GUID}_uistate: {UI state persistence}
  simciv_{GUID}_cache: {cached game data}
```

**Storage Access Patterns:**
1. Read GUID from URL or cookie
2. Construct storage key with GUID prefix
3. Access storage with prefixed key
4. Isolate all operations to GUID namespace

### Multi-User Support Model

**Same Browser, Different Users:**
- User A accesses "/id={GUID_A}", stores data in GUID_A namespace
- User A logs out, clearing GUID_A cookie
- User B accesses "/", gets new GUID_B, redirected to "/id={GUID_B}"
- User B's data stored in GUID_B namespace
- Both users' data coexist in local storage
- No collision, no mixing

**Understanding Required:**
Users must understand:
- Each GUID represents a separate session
- Returning to same GUID URL resumes that session
- Different GUIDs provide complete separation
- Bookmark GUID URL to return to specific session
- Cookie determines which session is active

**Security Implications:**
- Physical access to browser grants access to all stored GUIDs
- Local storage readable by anyone with browser access
- Private keys protected by password encryption
- Multiple GUIDs increase attack surface slightly
- Storage cleanup responsibility on client

### Storage Lifecycle

**Creation:**
- Initialize GUID namespace on first access to session
- Create storage entries as needed
- No pre-allocation of storage space

**Maintenance:**
- Update storage values during session use
- Persist changes immediately (local storage is synchronous)
- No explicit save/sync needed

**Cleanup:**
- On logout: optionally clear current GUID namespace
- On expired session: optionally mark for cleanup
- Periodic cleanup: remove old/unused GUID data
- User-initiated: "Clear all sessions" option

---

## Security Architecture

### Threat Model

**Protected Against:**
1. **Network Eavesdropping**: Challenge/response prevents password exposure
2. **Server Compromise**: No server-side password storage
3. **Database Breach**: Public keys and challenges non-sensitive
4. **Replay Attacks**: Single-use, expiring challenges
5. **Session Hijacking**: Secure cookie properties, HTTPS
6. **CSRF Attacks**: SameSite cookie attribute
7. **XSS Attacks**: HttpOnly cookies, CSP headers

**Not Protected Against:**
1. **Physical Access**: Local storage readable if browser accessible
2. **Client-Side Malware**: Keyloggers, memory scrapers
3. **Weak Passwords**: User responsibility to choose strong passwords
4. **Social Engineering**: Phishing for password and alias
5. **Browser Compromise**: XSS or extension attacks

### Defense in Depth

**Layer 1: Transport Security**
- Mandatory HTTPS in production
- TLS 1.2 minimum
- Strong cipher suites
- Certificate validation

**Layer 2: Authentication Security**
- Cryptographic challenge/response
- Short-lived challenges
- Single-use tokens
- Side-channel resistance

**Layer 3: Session Security**
- Secure session identifiers (GUIDs)
- Cookie security properties
- Session timeout policies
- Session fixation prevention

**Layer 4: Storage Security**
- Encrypted private key storage
- Password-derived encryption keys
- High-iteration KDFs
- Salt uniqueness

**Layer 5: Application Security**
- Input validation on alias
- Public key format validation
- Rate limiting on authentication attempts
- Audit logging of security events

### Privacy Considerations

**Data Minimization:**
- No server-side password storage
- No biometric data collection
- Optional IP logging
- Minimal session metadata

**User Control:**
- User owns private key
- User controls alias
- User can delete account
- User can export/rotate keys

**Anonymity Support:**
- Pseudonymous aliases allowed
- No email requirement
- No personal information required
- No phone verification needed

---

## Integration Points

### Database Schema Extensions

**New Collections/Tables Required:**

**users:**
- alias (string, unique, indexed)
- publicKey (text/blob)
- accountStatus (enum)
- createdAt (timestamp)
- lastLoginAt (timestamp)

**sessions:**
- sessionGuid (string, primary key)
- userId (optional reference to users)
- state (enum)
- createdAt (timestamp)
- lastAccessAt (timestamp)
- expiresAt (timestamp)
- ipAddress (optional string)
- userAgent (optional string)

**challenges:**
- challengeId (string, primary key)
- alias (string, reference to users)
- challenge (text/blob)
- encryptedChallenge (text/blob)
- createdAt (timestamp)
- expiresAt (timestamp)
- used (boolean)

**Indexes Required:**
- users.alias (unique)
- sessions.sessionGuid (primary)
- sessions.expiresAt (for cleanup queries)
- challenges.alias (for lookup)
- challenges.expiresAt (for cleanup queries)

### API Endpoints

**Account Management:**
- POST /api/auth/check-alias: Check alias availability
- POST /api/auth/register: Create new account
- POST /api/auth/rotate-key: Rotate user's public key

**Authentication:**
- POST /api/auth/challenge: Request authentication challenge
- POST /api/auth/respond: Submit challenge response
- POST /api/auth/logout: Terminate session

**Session Management:**
- GET /: Redirect to session GUID URL
- GET /id={GUID}: Load application with session context
- GET /api/session/status: Check current session state

### Client-Side Components

**Registration Flow:**
- Registration form component
- Key generation utility
- Private key encryption utility
- Storage management utility

**Authentication Flow:**
- Login form component
- Challenge request handler
- Challenge decryption utility
- Response submission handler

**Session Management:**
- GUID extraction from URL/cookie
- Storage namespace initialization
- Session state synchronization
- Logout handler

---

## Implementation Considerations

### Cryptographic Library Requirements

**Server-Side (Go/Rust/Node.js):**
- RSA or ECC key handling
- Secure random number generation
- Public key storage and retrieval
- Challenge encryption capabilities

**Client-Side (JavaScript):**
- Web Crypto API for:
  - Key pair generation
  - Asymmetric encryption/decryption
  - Key derivation functions
  - Symmetric encryption (for private key storage)
- Fallback crypto library if Web Crypto unavailable
- Secure random generation
- Memory-safe key handling

### Browser Compatibility

**Minimum Requirements:**
- Local Storage API support
- Web Crypto API support (or fallback)
- Cookie support
- ES6+ JavaScript features

**Progressive Enhancement:**
- Detect Web Crypto availability
- Fallback to library implementation if needed
- Clear error messages for unsupported browsers
- Graceful degradation where possible

### Performance Considerations

**Client-Side:**
- Key generation may take seconds (one-time operation)
- Key derivation intentionally slow (security feature)
- Challenge decryption fast (milliseconds)
- Local storage access synchronous but fast

**Server-Side:**
- GUID generation lightweight
- Challenge encryption fast
- Database lookups indexed for performance
- Session validation cached where appropriate

**Optimization Strategies:**
- Pre-generate challenge during alias lookup
- Cache public keys temporarily
- Batch session cleanup operations
- Use database connection pooling

### Error Handling

**Client-Side Errors:**
- Key generation failure: Clear error, retry mechanism
- Storage quota exceeded: Cleanup old data, warn user
- Decryption failure: Wrong password message, retry limit
- Network errors: Retry logic, offline detection

**Server-Side Errors:**
- Duplicate alias: Clear error message
- Invalid public key: Validation failure details
- Challenge expired: Request new challenge
- Session not found: Redirect to root for new session

**Security Errors:**
- Authentication failures logged
- Rate limiting on repeated failures
- Account lockout after threshold
- Audit trail of security events

---

## Operational Procedures

### Deployment Requirements

**Infrastructure:**
- HTTPS certificate and configuration
- Database with appropriate schema
- Session cleanup job scheduling
- Monitoring and alerting

**Configuration:**
- Challenge TTL setting
- Session timeout policies
- KDF iteration counts
- Cookie domain and attributes

**Security Hardening:**
- CSP headers configured
- CORS policies set
- Rate limiting enabled
- Audit logging active

### Monitoring and Metrics

**Authentication Metrics:**
- Registration rate
- Authentication success/failure rates
- Challenge expiration rate
- Average authentication time

**Session Metrics:**
- Active sessions count
- Session duration distribution
- Logout vs. timeout ratio
- Concurrent users per browser (GUID count)

**Security Metrics:**
- Failed authentication attempts
- Suspicious activity patterns
- Account lockouts
- Key rotation frequency

### Maintenance Operations

**Regular Maintenance:**
- Purge expired sessions (hourly/daily)
- Clean up expired challenges (hourly)
- Archive old audit logs (weekly)
- Review security metrics (daily)

**Incident Response:**
- Account compromise procedure
- Key rotation enforcement
- Session revocation
- Audit log analysis

**User Support:**
- Account recovery (without password reset)
- Key regeneration process
- Session confusion resolution
- Multi-browser setup assistance

---

## Future Enhancements

### Not in Version 0.0001

The following features are explicitly out of scope for this version but documented for future consideration:

**Password Recovery:**
- Current design: No password recovery (by design)
- Future: Backup key options, recovery keys, social recovery

**Multi-Device Support:**
- Current: Each device gets separate session
- Future: Key export/import, device management, sync

**Advanced Session Management:**
- Current: Simple GUID per session
- Future: Named sessions, device fingerprinting, trusted devices

**Enhanced Security:**
- Current: Basic challenge/response
- Future: 2FA support, hardware token integration, biometric options

**Account Linking:**
- Current: Each alias independent
- Future: Link multiple aliases, account merging, SSO integration

**Social Features:**
- Current: No social graph
- Future: Friend lists, presence, cross-user interactions

---

## Testing Strategy

### Security Testing

**Authentication Flow:**
- Test successful authentication path
- Test failure cases (wrong password, expired challenge)
- Test replay attack prevention
- Test concurrent authentication attempts

**Key Management:**
- Test key generation success
- Test encryption/decryption correctness
- Test storage isolation between GUIDs
- Test password strength scenarios

**Session Management:**
- Test session creation and persistence
- Test cookie security attributes
- Test GUID collision handling
- Test session timeout behavior

### Integration Testing

**End-to-End Flows:**
- Complete registration flow
- Complete login flow
- Multi-user same-browser scenario
- Session recovery after browser restart

**Cross-Browser Testing:**
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)
- Private/Incognito mode behavior
- Cookie and storage behavior variations

### Performance Testing

**Load Testing:**
- Concurrent registrations
- Concurrent authentications
- Challenge generation under load
- Database query performance

**Client Performance:**
- Key generation time measurement
- Key derivation time (intentionally slow)
- Storage operation speed
- Overall login time

---

## Design Alternatives Considered

### Alternative 1: Traditional Password Authentication
**Description:** Store password hashes server-side, validate on login.
**Rejected Because:** Passwords transmitted over network; server breach exposes hashes; no technical differentiation.

### Alternative 2: OAuth/SSO Integration
**Description:** Use third-party identity providers (Google, GitHub, etc.).
**Rejected Because:** Requires external accounts; reduces user anonymity; adds dependency on external services; doesn't fit game's vision.

### Alternative 3: JWT Tokens Instead of Server Sessions
**Description:** Issue signed JWT tokens, no server-side session state.
**Rejected Because:** Harder to revoke; no natural GUID lifecycle; complicates multi-user same-browser scenario.

### Alternative 4: Session Storage Instead of Local Storage
**Description:** Use sessionStorage for private keys instead of localStorage.
**Rejected Because:** Lost on tab close; worse user experience; still need localStorage for multi-GUID support.

### Alternative 5: Password-Based Encryption of Everything
**Description:** Encrypt all local storage with password.
**Rejected Because:** Requires password entry on every page load; poor UX; doesn't align with session model.

---

## Glossary

**Alias:** User-chosen identifier serving as username; unique across system.

**Challenge:** Random string generated by server for authentication; encrypted with user's public key.

**GUID:** Globally Unique Identifier; 128-bit value identifying a session.

**KDF:** Key Derivation Function; algorithm converting password to encryption key.

**Private Key:** Secret cryptographic key; stored encrypted on client.

**Public Key:** Non-secret cryptographic key; stored on server; used to encrypt challenges.

**Session:** Server-side record of user's interaction; identified by GUID.

**Challenge/Response:** Authentication method where server challenges client to prove identity without transmitting password.

**Local Storage:** Browser API for persistent client-side data storage.

**Namespace:** Prefix system for storage keys enabling separation of data.

---

## Conclusion

This design provides a secure, privacy-preserving, and user-friendly authentication system for SimCiv. The cryptographic challenge/response approach eliminates password transmission vulnerabilities while the GUID-based session and storage management enables flexible multi-user support.

Key strengths:
1. **Security:** No password transmission or server-side storage
2. **Privacy:** Minimal data collection, user-controlled keys
3. **Flexibility:** Multi-user same-browser support through GUID isolation
4. **Simplicity:** Clear session lifecycle and storage model
5. **Scalability:** Stateless authentication compatible with distributed systems

The design integrates cleanly with SimCiv's existing database-centric architecture while adding no new architectural dependencies. Implementation can proceed incrementally, with each component testable in isolation.

This specification provides the foundation for user identity in SimCiv, enabling account creation, secure authentication, and session persistence across the game's client and server components.

---

*This design document is ready for review and implementation planning. No code examples are provided intentionally to keep the focus on design principles and architecture.*
