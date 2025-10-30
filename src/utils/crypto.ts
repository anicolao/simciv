import crypto from 'crypto';

/**
 * Generate a cryptographically secure random challenge string
 */
export function generateChallenge(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64');
}

// Counter for deterministic UUID generation in E2E tests
let deterministicUuidCounter = 0;

/**
 * Generate a new session GUID (UUID v4)
 */
export function generateGuid(): string {
  return crypto.randomUUID();
}

/**
 * Generate a deterministic UUID for E2E testing
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where x is deterministic hex and y is 8,9,a,or b
 * This follows UUID v4 format but with predictable values
 */
export function generateDeterministicUuid(seed: string = ''): string {
  if (process.env.NODE_ENV === 'test' || process.env.E2E_TEST_MODE === '1') {
    // Create a deterministic hash from seed and counter
    const hash = crypto.createHash('sha256').update(`${seed}${deterministicUuidCounter++}`).digest('hex');
    
    // Format as UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // The '4' in position 14 indicates version 4
    // The 'y' in position 19 must be 8, 9, a, or b (2 high bits are 10)
    const uuid = [
      hash.slice(0, 8),
      hash.slice(8, 12),
      '4' + hash.slice(13, 16), // Version 4
      ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.slice(18, 21), // Variant bits
      hash.slice(21, 33)
    ].join('-');
    
    return uuid;
  }
  return crypto.randomUUID();
}

/**
 * Reset the deterministic UUID counter (for test isolation)
 */
export function resetDeterministicUuidCounter(): void {
  deterministicUuidCounter = 0;
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
