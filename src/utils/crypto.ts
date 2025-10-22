import crypto from 'crypto';

/**
 * Generate a cryptographically secure random challenge string
 */
export function generateChallenge(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Generate a new session GUID (UUID v4)
 */
export function generateGuid(): string {
  return crypto.randomUUID();
}

/**
 * Encrypt a challenge using RSA public key
 */
export function encryptChallenge(challenge: string, publicKeyPem: string): string {
  try {
    const buffer = Buffer.from(challenge, 'utf-8');
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    );
    return encrypted.toString('base64');
  } catch (error) {
    throw new Error(`Failed to encrypt challenge: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate that a public key is in the correct format
 */
export function validatePublicKey(publicKeyPem: string): boolean {
  try {
    const key = crypto.createPublicKey(publicKeyPem);
    const keyDetails = key.asymmetricKeyDetails;
    
    // Ensure it's RSA and at least 2048 bits
    if (key.asymmetricKeyType !== 'rsa') {
      return false;
    }
    
    if (keyDetails && keyDetails.modulusLength && keyDetails.modulusLength < 2048) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate that a string is a valid GUID format
 */
export function isValidGuid(guid: string): boolean {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return guidRegex.test(guid);
}
