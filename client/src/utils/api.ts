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

/**
 * Game-related types and functions
 */
export interface Game {
  gameId: string;
  creatorUserId: string;
  maxPlayers: number;
  currentPlayers: number;
  playerList?: string[];
  state: 'waiting' | 'started';
  currentYear: number;
  createdAt: string;
  startedAt?: string;
  lastTickAt?: string;
}

export interface GamesListResponse {
  success: boolean;
  games: Game[];
}

export interface GameResponse {
  success: boolean;
  game: Game;
}

/**
 * Get all games
 */
export async function getGames(): Promise<GamesListResponse> {
  const response = await fetch('/api/games');
  return await response.json();
}

/**
 * Get a specific game
 */
export async function getGame(gameId: string): Promise<GameResponse> {
  const response = await fetch(`/api/games/${gameId}`);
  return await response.json();
}

/**
 * Create a new game
 */
export async function createGame(maxPlayers: number): Promise<GameResponse> {
  const response = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ maxPlayers })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create game');
  }

  return await response.json();
}

/**
 * Join a game
 */
export async function joinGame(gameId: string): Promise<GameResponse> {
  const response = await fetch(`/api/games/${gameId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to join game');
  }

  return await response.json();
}

/**
 * Get user's games
 */
export async function getMyGames(): Promise<GamesListResponse> {
  const response = await fetch('/api/games/user/my-games');
  return await response.json();
}

/**
 * Map-related types and functions
 */
export interface MapTile {
  gameId: string;
  x: number;
  y: number;
  elevation: number;
  terrainType: string;
  climateZone: string;
  hasRiver: boolean;
  isCoastal: boolean;
  resources: string[];
}

export interface StartingPosition {
  gameId: string;
  playerId: string;
  centerX: number;
  centerY: number;
  startingCityX: number;
  startingCityY: number;
}

export interface MapMetadata {
  gameId: string;
  seed: string;
  width: number;
  height: number;
  playerCount: number;
  seaLevel: number;
}

/**
 * Get map tiles for a game
 */
export async function getMapTiles(gameId: string): Promise<{ tiles: MapTile[] }> {
  const response = await fetch(`/api/map/${gameId}/tiles`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch map tiles');
  }
  return await response.json();
}

/**
 * Get player's starting position
 */
export async function getStartingPosition(gameId: string): Promise<{ position: StartingPosition }> {
  const response = await fetch(`/api/map/${gameId}/starting-position`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch starting position');
  }
  return await response.json();
}

/**
 * Get map metadata
 */
export async function getMapMetadata(gameId: string): Promise<{ metadata: MapMetadata }> {
  const response = await fetch(`/api/map/${gameId}/metadata`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch map metadata');
  }
  return await response.json();
}

/**
 * Settlers-related types and functions
 */
export interface Unit {
  unitId: string;
  unitType: 'settlers';
  location: {
    x: number;
    y: number;
  };
  stepsTaken: number;
  populationCost: number;
}

export interface Settlement {
  settlementId: string;
  name: string;
  type: 'nomadic_camp';
  location: {
    x: number;
    y: number;
  };
}

/**
 * Get units for a game
 */
export async function getUnits(gameId: string): Promise<{ units: Unit[] }> {
  const response = await fetch(`/api/game/${gameId}/units`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch units');
  }
  return await response.json();
}

/**
 * Get settlements for a game
 */
export async function getSettlements(gameId: string): Promise<{ settlements: Settlement[] }> {
  const response = await fetch(`/api/game/${gameId}/settlements`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch settlements');
  }
  return await response.json();
}

