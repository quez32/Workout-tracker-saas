// ============================================
// JWT Authentication Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { AuthPayload } from '../types';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required. Please provide a valid token.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, error: 'Invalid or expired token.' });
    return;
  }
}

export function generateToken(payload: AuthPayload): string {
  const options: SignOptions = {
    expiresIn: config.JWT_EXPIRES_IN as string & SignOptions['expiresIn'],
  };
  return jwt.sign(payload, config.JWT_SECRET, options);
}
