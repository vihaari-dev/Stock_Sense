import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Error class that carries an HTTP status code and a machine-readable code
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Convenience factory shortcuts used across controllers
export const Errors = {
  badRequest: (message: string, details?: Record<string, unknown>) =>
    new AppError(400, 'VALIDATION_ERROR', message, details),
  unauthorized: (message = 'Unauthorized') =>
    new AppError(401, 'UNAUTHORIZED', message),
  forbidden: (message = 'Forbidden') =>
    new AppError(403, 'FORBIDDEN', message),
  notFound: (resource = 'Resource') =>
    new AppError(404, 'NOT_FOUND', `${resource} not found`),
  conflict: (message: string) =>
    new AppError(409, 'CONFLICT', message),
  businessRule: (message: string, details?: Record<string, unknown>) =>
    new AppError(422, 'BUSINESS_RULE_ERROR', message, details),
  internal: (message = 'Internal server error') =>
    new AppError(500, 'INTERNAL_ERROR', message),
};

// Global Express error handler — must be last middleware in app.ts
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Sequelize unique constraint
  if (isSequelizeUniqueError(err)) {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'A record with this value already exists.' } });
    return;
  }

  // Unexpected error
  logger.error('Unhandled error', { error: err, path: req.path, method: req.method });
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
}

function isSequelizeUniqueError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'SequelizeUniqueConstraintError'
  );
}
