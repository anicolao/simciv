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
