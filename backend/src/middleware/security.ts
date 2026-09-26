import { Request, Response, NextFunction } from 'express';
import { verifyToken, timingSafeEqualString } from '../utils/security';

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        role: 'employee' | 'owner';
        name: string;
      };
    }
  }
}

/**
 * 1. Security HTTP Headers Middleware
 * Protects against MIME-sniffing, clickjacking, and cross-site scripting
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:;"
  );
  next();
}

/**
 * 2. In-Memory Rate Limiter
 * Lightweight, zero-dependency, auto-expiring rate limiter
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
}) {
  const store = new Map<string, RateLimitRecord>();

  // Cleanup expired entries periodically (every 5 minutes)
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    // Determine client IP (handles x-forwarded-for if behind reverse proxy)
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || '127.0.0.1';

    const now = Date.now();
    const record = store.get(ip);

    if (!record || now > record.resetTime) {
      store.set(ip, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', options.max - 1);
      return next();
    }

    if (record.count >= options.max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', 0);
      return res.status(429).json({
        success: false,
        message: options.message,
        retryAfter: `${retryAfterSeconds} seconds`,
      });
    }

    record.count += 1;
    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - record.count));
    next();
  };
}

/**
 * Rate limit for authentication attempts (PIN verification)
 * Maximum 5 attempts per 15 minutes per IP to completely stop brute-forcing
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
});

/**
 * General API rate limiter
 * 300 requests per minute per IP
 */
export const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  message: 'Too many requests. Please slow down.',
});

/**
 * 3. Token Authentication Middleware
 * Extracts and verifies JWT from Authorization header
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    const user = verifyToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

/**
 * 4. Role Authorization Middleware
 * Protects administrative/owner-only routes (settings, parts write, sensitive sync)
 */
export function requireOwner(req: Request, res: Response, next: NextFunction) {
  // First check if JWT user is owner
  if (req.user && req.user.role === 'owner') {
    return next();
  }

  // Check fallback owner PIN header (for direct authenticated API requests)
  const pinHeader = req.headers['x-owner-pin'];
  const OWNER_PIN = process.env.OWNER_PIN || '9974';
  if (typeof pinHeader === 'string' && timingSafeEqualString(pinHeader.trim(), OWNER_PIN)) {
    req.user = { role: 'owner', name: 'Owner (Ashok Bhai / Mitesh)' };
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Owner authorization required.',
  });
}
