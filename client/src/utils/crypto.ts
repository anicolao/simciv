/**
 * Client-side cryptographic utilities for SimCiv authentication
 */

export interface EncryptedKeyData {
  encryptedKey: number[];
  salt: number[];
  iv: number[];
  algorithm: string;
  keyDerivation: {
    function: string;
    iterations: number;
    hash: string;
  };
  version: number;
  createdAt: string;
}

/**
 * Generate RSA key pair using Web Crypto API
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export public key to PEM format
 */
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  const exportedAsBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64.match(/.{1,64}/g)!.join('\n')}\n-----END PUBLIC KEY-----`;
}

/**
 * Export private key to ArrayBuffer
 */
export async function exportPrivateKey(privateKey: CryptoKey): Promise<ArrayBuffer> {
  return await window.crypto.subtle.exportKey('pkcs8', privateKey);
}

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt private key with password
 */
export async function encryptPrivateKey(
  privateKeyData: ArrayBuffer,
  password: string
): Promise<EncryptedKeyData> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKeyFromPassword(password, salt);

  const encryptedKey = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    privateKeyData
  );

  return {
    encryptedKey: Array.from(new Uint8Array(encryptedKey)),
    salt: Array.from(salt),
    iv: Array.from(iv),
    algorithm: 'AES-GCM',
    keyDerivation: {
      function: 'PBKDF2',
      iterations: 100000,
      hash: 'SHA-256'
    },
    version: 1,
    createdAt: new Date().toISOString()
  };
}

/**
 * Decrypt private key with password
 */
export async function decryptPrivateKey(
  encryptedData: EncryptedKeyData,
  password: string
): Promise<CryptoKey> {
  const salt = new Uint8Array(encryptedData.salt);
  const iv = new Uint8Array(encryptedData.iv);
  const encryptedKey = new Uint8Array(encryptedData.encryptedKey);

  const key = await deriveKeyFromPassword(password, salt);

  const decryptedKey = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encryptedKey
  );

  return await window.crypto.subtle.importKey(
    'pkcs8',
    decryptedKey,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );
}

/**
 * Decrypt challenge using private key
 */
export async function decryptChallenge(
  encryptedChallenge: string,
  privateKey: CryptoKey
): Promise<string> {
  const encryptedBuffer = Uint8Array.from(atob(encryptedChallenge), c => c.charCodeAt(0));

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encryptedBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
