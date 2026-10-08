/**
 * Authentication Middleware - Firebase JWT Verification
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Extend Express Request type
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        role: 'donor' | 'doctor' | 'counselor' | 'admin';
        donorId?: string;
      };
    }
  }
}

/**
 * Verify JWT token and extract user info
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({ error: 'Missing authorization token' });
      return;
    }

    // In production, verify with Firebase
    // For now, mock verification
    const user = await verifyToken(token);

    if (!user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed', details: String(error) });
  }
}

/**
 * Extract token from request
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Verify JWT token (mock - integrate Firebase in production)
 */
async function verifyToken(token: string): Promise<any> {
  // In production:
  // const decoded = await admin.auth().verifyIdToken(token);
  // return {
  //   uid: decoded.uid,
  //   email: decoded.email,
  //   role: decoded.custom_claims.role,
  //   donorId: decoded.custom_claims.donorId
  // };

  // Mock token verification
  return {
    uid: 'user123',
    email: 'user@example.com',
    role: 'donor',
    donorId: 'donor123',
  };
}

/**
 * Verify user has required role
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

/**
 * Verify user is authenticated donor
 */
export function requireDonor(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.donorId) {
    res.status(403).json({ error: 'Donor ID required' });
    return;
  }
  next();
}

/**
 * Verify user is doctor or counselor
 */
export function requireHealthcare(req: Request, res: Response, next: NextFunction): void {
  if (
    !req.user ||
    !['doctor', 'counselor', 'admin'].includes(req.user.role)
  ) {
    res.status(403).json({ error: 'Healthcare role required' });
    return;
  }
  next();
}
