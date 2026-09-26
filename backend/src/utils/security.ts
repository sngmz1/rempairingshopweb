import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Security and Cryptography Utilities for Jai Mataji Mobile Repairing
 * Implements authenticated encryption (AES-256-GCM), bcrypt PIN hashing,
 * and signed JWT session token generation.
 */

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

/**
 * Get the 32-byte (256-bit) master encryption key from environment.
 * If not configured, derives a stable key using HMAC-SHA256 from JWT_SECRET or a fallback.
 */
function getMasterKey(providedKeyHex?: string): Buffer {
  const keyHex = providedKeyHex || process.env.ENCRYPTION_KEY;
  if (keyHex && keyHex.length === 64) {
    return Buffer.from(keyHex, 'hex');
  }
  // Derive 32-byte key from JWT_SECRET if explicit key not provided
  const salt = 'JaiMataji_Master_Key_Derivation_Salt_2026';
  const secret = process.env.JWT_SECRET || 'JaiMataji_Default_Dev_Secret_Do_Not_Use_In_Prod_32bytes!';
  return crypto.createHmac('sha256', salt).update(secret).digest();
}

/**
 * Encrypts a string using Authenticated AES-256-GCM.
 * Never reuses nonces/IVs: generates a cryptographically secure random 12-byte IV for every encryption.
 */
export function encryptData(plaintext: string, keyHex?: string): {
  ciphertext: string;
  iv: string;
  authTag: string;
} {
  const key = getMasterKey(keyHex);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
}

/**
 * Decrypts AES-256-GCM encrypted data.
 * Verifies authenticity using the 16-byte auth tag before releasing plaintext.
 */
export function decryptData(
  ciphertextHex: string,
  ivHex: string,
  authTagHex: string,
  keyHex?: string
): string {
  const key = getMasterKey(keyHex);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Securely hashes a PIN or password using bcrypt with strong salt rounds.
 */
export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin, salt);
}

/**
 * Verifies a PIN against a bcrypt hash.
 */
export async function verifyPinHash(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Performs a constant-time string comparison to prevent timing attacks.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generates a signed JWT session token for authenticated operations.
 */
export function generateToken(payload: { role: 'employee' | 'owner'; name: string }, expiresIn: string = '8h'): string {
  const secret = process.env.JWT_SECRET || 'JaiMataji_Default_Dev_Secret_Do_Not_Use_In_Prod_32bytes!';
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
}

/**
 * Verifies a JWT session token.
 */
export function verifyToken(token: string): { role: 'employee' | 'owner'; name: string } | null {
  try {
    const secret = process.env.JWT_SECRET || 'JaiMataji_Default_Dev_Secret_Do_Not_Use_In_Prod_32bytes!';
    return jwt.verify(token, secret) as { role: 'employee' | 'owner'; name: string };
  } catch {
    return null;
  }
}

/**
 * Strips dangerous HTML tags and script elements to sanitize user text inputs.
 */
export function sanitizeInput(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
}
