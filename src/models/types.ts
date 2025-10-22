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
