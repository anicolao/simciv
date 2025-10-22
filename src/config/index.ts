export interface Config {
  port: number;
  mongoUri: string;
  dbName: string;
  challengeTtlMinutes: number;
  sessionIdleTimeoutMinutes: number;
  sessionAbsoluteTimeoutMinutes: number;
  cookieName: string;
  cookieSecure: boolean;
  cookieHttpOnly: boolean;
  cookieSameSite: 'strict' | 'lax' | 'none';
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017',
  dbName: process.env.DB_NAME || 'simciv',
  challengeTtlMinutes: parseInt(process.env.CHALLENGE_TTL_MINUTES || '5', 10),
  sessionIdleTimeoutMinutes: parseInt(process.env.SESSION_IDLE_TIMEOUT_MINUTES || '60', 10),
  sessionAbsoluteTimeoutMinutes: parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT_MINUTES || '1440', 10),
  cookieName: 'simciv_session',
  cookieSecure: process.env.NODE_ENV === 'production',
  cookieHttpOnly: true,
  cookieSameSite: 'lax',
};
