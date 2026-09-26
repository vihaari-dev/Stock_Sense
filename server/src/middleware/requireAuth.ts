import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { Errors } from './errorHandler';
import { JwtPayload } from '../types';

/**
 * requireAuth — verifies the Bearer JWT in the Authorization header.
 * On success, attaches req.user = { sub, loginId, role, iat, exp }.
 * On failure, passes an AppError(401) to the error handler.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(Errors.unauthorized('Missing or malformed Authorization header.'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as unknown as JwtPayload;
    req.user = payload;
    next();
  } catch {
    next(Errors.unauthorized('Access token is invalid or expired.'));
  }
}

/**
 * requireRole — gates a route to specific roles.
 * Must be used AFTER requireAuth so req.user is populated.
 *
 * Usage: router.post('/receipts', requireAuth, requireRole('inventory_manager'), handler)
 */
export function requireRole(...roles: Array<'inventory_manager' | 'warehouse_staff'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(Errors.forbidden());
    }
    next();
  };
}
