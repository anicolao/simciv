export interface User {
  alias: string;
  publicKey: string;
  accountStatus: 'active' | 'suspended' | 'deleted';
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface Session {
  sessionGuid: string;
  userId?: string;
  state: 'unauthenticated' | 'authenticating' | 'authenticated' | 'expired' | 'terminated';
  createdAt: Date;
  lastAccessAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface Challenge {
  challengeId: string;
  alias: string;
  challenge: string;
  encryptedChallenge: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

export interface Game {
  gameId: string;
  creatorUserId: string;
  maxPlayers: number;
  currentPlayers: number;
  playerList: string[];
  state: 'waiting' | 'started';
  currentYear: number;
  createdAt: Date;
  startedAt?: Date;
  lastTickAt?: Date;
}

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
  improvements: string[];
  ownerId?: string;
  visibleTo: string[];
  createdAt: Date;
}

export interface StartingPosition {
  gameId: string;
  playerId: string;
  centerX: number;
  centerY: number;
  startingCityX: number;
  startingCityY: number;
  regionScore: number;
  revealedTiles: number;
  guaranteedFootprint: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  createdAt: Date;
}

export interface MapMetadata {
  gameId: string;
  seed: string;
  width: number;
  height: number;
  playerCount: number;
  seaLevel: number;
  generatedAt: Date;
  generationTimeMs: number;
}
