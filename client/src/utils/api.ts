/**
 * API client for SimCiv authentication
 */

export interface SessionStatus {
  sessionGuid: string;
  state: string;
  userId?: string;
  createdAt: string;
  expiresAt: string;
}

export interface ChallengeResponse {
  challengeId: string;
  encryptedChallenge: string;
}

export interface AuthResponse {
  success: boolean;
  alias?: string;
  error?: string;
}

/**
 * Check if alias is available
 */
export async function checkAliasAvailability(alias: string): Promise<boolean> {
  const response = await fetch('/api/auth/check-alias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alias })
  });

  const data = await response.json();
  return data.available;
}

/**
 * Register a new user
 */
export async function registerUser(alias: string, publicKey: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alias, publicKey })
  });

  return await response.json();
}

/**
 * Request authentication challenge
 */
export async function requestChallenge(alias: string): Promise<ChallengeResponse> {
  const response = await fetch('/api/auth/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alias })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get challenge');
  }

  return await response.json();
}

/**
 * Submit challenge response
 */
export async function submitChallengeResponse(
  challengeId: string,
  response: string
): Promise<AuthResponse> {
  const res = await fetch('/api/auth/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId, response })
  });

  return await res.json();
}

/**
 * Logout current session
 */
export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Get session status
 */
export async function getSessionStatus(): Promise<SessionStatus> {
  const response = await fetch('/api/session/status');
  return await response.json();
}
