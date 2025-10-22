import {
  generateChallenge,
  generateGuid,
  encryptChallenge,
  validatePublicKey,
  isValidGuid,
} from '../../utils/crypto';
import crypto from 'crypto';

describe('Crypto Utils', () => {
  describe('generateChallenge', () => {
    it('should generate a challenge of default length', () => {
      const challenge = generateChallenge();
      expect(challenge).toBeDefined();
      expect(typeof challenge).toBe('string');
      expect(challenge.length).toBeGreaterThan(0);
    });

    it('should generate unique challenges', () => {
      const challenge1 = generateChallenge();
      const challenge2 = generateChallenge();
      expect(challenge1).not.toBe(challenge2);
    });

    it('should generate challenges of specified length', () => {
      const challenge = generateChallenge(64);
      const buffer = Buffer.from(challenge, 'base64');
      expect(buffer.length).toBe(64);
    });
  });

  describe('generateGuid', () => {
    it('should generate a valid UUID v4', () => {
      const guid = generateGuid();
      expect(guid).toBeDefined();
      expect(isValidGuid(guid)).toBe(true);
    });

    it('should generate unique GUIDs', () => {
      const guid1 = generateGuid();
      const guid2 = generateGuid();
      expect(guid1).not.toBe(guid2);
    });
  });

  describe('isValidGuid', () => {
    it('should validate correct GUIDs', () => {
      const guid = generateGuid();
      expect(isValidGuid(guid)).toBe(true);
    });

    it('should reject invalid GUIDs', () => {
      expect(isValidGuid('invalid')).toBe(false);
      expect(isValidGuid('12345678-1234-1234-1234-123456789012')).toBe(false);
      expect(isValidGuid('')).toBe(false);
    });
  });

  describe('validatePublicKey', () => {
    let validKeyPair: crypto.KeyPairSyncResult<string, string>;

    beforeAll(() => {
      validKeyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });
    });

    it('should accept valid RSA 2048 public key', () => {
      expect(validatePublicKey(validKeyPair.publicKey)).toBe(true);
    });

    it('should accept RSA 4096 public key', () => {
      const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });
      expect(validatePublicKey(keyPair.publicKey)).toBe(true);
    });

    it('should reject invalid key format', () => {
      expect(validatePublicKey('invalid key')).toBe(false);
      expect(validatePublicKey('')).toBe(false);
    });

    it('should reject keys smaller than 2048 bits', () => {
      const weakKeyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 1024,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });
      expect(validatePublicKey(weakKeyPair.publicKey)).toBe(false);
    });
  });

  describe('encryptChallenge', () => {
    let keyPair: crypto.KeyPairSyncResult<string, string>;
    let challenge: string;

    beforeAll(() => {
      keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });
      challenge = generateChallenge();
    });

    it('should encrypt a challenge with a public key', () => {
      const encrypted = encryptChallenge(challenge, keyPair.publicKey);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should produce different ciphertext for the same challenge', () => {
      const encrypted1 = encryptChallenge(challenge, keyPair.publicKey);
      const encrypted2 = encryptChallenge(challenge, keyPair.publicKey);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should be decryptable with the private key', () => {
      const encrypted = encryptChallenge(challenge, keyPair.publicKey);
      const encryptedBuffer = Buffer.from(encrypted, 'base64');
      
      const decrypted = crypto.privateDecrypt(
        {
          key: keyPair.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        encryptedBuffer
      );
      
      expect(decrypted.toString('utf-8')).toBe(challenge);
    });

    it('should throw error with invalid public key', () => {
      expect(() => {
        encryptChallenge(challenge, 'invalid key');
      }).toThrow();
    });
  });
});
