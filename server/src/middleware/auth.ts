import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwt.secret) as unknown as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Expired or invalid token' } });
  }
}

export function requireRole(...roles: Array<'inventory_manager' | 'warehouse_staff'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient role permissions' } });
      return;
    }

    next();
  };
}
