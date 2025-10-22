/**
 * Client-side storage utilities for SimCiv authentication
 */

import type { EncryptedKeyData } from './crypto';

/**
 * Get session GUID from URL
 */
export function getSessionGuid(): string | null {
  const urlMatch = window.location.pathname.match(/\/id=([a-f0-9-]+)/i);
  return urlMatch ? urlMatch[1] : null;
}

/**
 * Store encrypted private key in local storage
 */
export function storeEncryptedKey(guid: string, encryptedData: EncryptedKeyData): void {
  localStorage.setItem(`simciv_${guid}_privatekey`, JSON.stringify(encryptedData));
}

/**
 * Retrieve encrypted private key from local storage
 */
export function getStoredEncryptedKey(guid: string): EncryptedKeyData | null {
  const data = localStorage.getItem(`simciv_${guid}_privatekey`);
  return data ? JSON.parse(data) : null;
}

/**
 * Store user alias in local storage
 */
export function storeAlias(guid: string, alias: string): void {
  localStorage.setItem(`simciv_${guid}_alias`, alias);
}

/**
 * Retrieve user alias from local storage
 */
export function getStoredAlias(guid: string): string | null {
  return localStorage.getItem(`simciv_${guid}_alias`);
}

/**
 * Clear all stored data for a session
 */
export function clearSessionData(guid: string): void {
  localStorage.removeItem(`simciv_${guid}_privatekey`);
  localStorage.removeItem(`simciv_${guid}_alias`);
}
