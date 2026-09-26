import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authRateLimiter } from '../middleware/security';
import { generateToken, verifyToken, timingSafeEqualString } from '../utils/security';
import { createErrorResponse } from '../utils/errors';

const router = Router();

const verifyPinSchema = z.object({
  pin: z.string().min(4, 'PIN must be at least 4 digits').max(10, 'PIN too long'),
  targetRole: z.enum(['employee', 'owner']).default('owner'),
});

/**
 * POST /api/auth/verify-pin
 * Rate-limited to 5 attempts per 15 minutes to prevent brute-force attacks.
 * Uses timing-safe comparison and returns a signed cryptographic JWT session token.
 */
router.post('/verify-pin', authRateLimiter, (req: Request, res: Response) => {
  try {
    const parsed = verifyPinSchema.parse(req.body);
    const { pin, targetRole } = parsed;

    const OWNER_PIN = process.env.OWNER_PIN || '9974';
    const EMPLOYEE_PIN = process.env.EMPLOYEE_PIN || '9974';

    if (targetRole === 'owner') {
      const isMatch = timingSafeEqualString(pin, OWNER_PIN);
      if (isMatch) {
        const token = generateToken(
          { role: 'owner', name: 'Owner (Ashok Bhai / Mitesh)' },
          '8h'
        );
        return res.json({
          success: true,
          role: 'owner',
          token,
          name: 'Owner (Ashok Bhai / Mitesh)',
          message: 'Owner authentication successful',
        });
      }
      return res.status(401).json(createErrorResponse('AUTH', '002', 'Invalid Owner PIN'));
    }

    // Employee role check
    const isEmployeeMatch = timingSafeEqualString(pin, EMPLOYEE_PIN) || timingSafeEqualString(pin, OWNER_PIN);
    if (isEmployeeMatch) {
      const token = generateToken(
        { role: 'employee', name: 'Shop Staff' },
        '8h'
      );
      return res.json({
        success: true,
        role: 'employee',
        token,
        name: 'Shop Staff',
        message: 'Staff authentication successful',
      });
    }

    return res.status(401).json(createErrorResponse('AUTH', '003', 'Invalid Staff PIN'));
  } catch (err: any) {
    const errorMsg = err.errors ? err.errors[0].message : 'Invalid request payload';
    return res.status(400).json(createErrorResponse('AUTH', '001', errorMsg));
  }
});

/**
 * GET /api/auth/session
 * Verifies if current Bearer token is valid
 */
router.get('/session', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json(createErrorResponse('AUTH', '005', 'No session token provided'));
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json(createErrorResponse('AUTH', '005', 'Session expired or invalid'));
  }

  return res.json({
    success: true,
    user,
  });
});

export default router;
