import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth';
import { Request, Response, NextFunction } from 'express';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many login attempts, please try again later' } },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many forgot password requests, please try again later' } },
});

function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array(),
      }
    });
    return;
  }
  next();
}

router.post(
  '/signup',
  [
    body('login_id').isString().isLength({ min: 6, max: 12 }),
    body('email').isEmail(),
    body('password').isString().isLength({ min: 8 }),
    body('role').isIn(['inventory_manager', 'warehouse_staff']),
    body('full_name').isString().notEmpty(),
    validateRequest
  ],
  authController.signup
);

router.post(
  '/login',
  loginLimiter,
  [
    body('login_id').isString().notEmpty(),
    body('password').isString().notEmpty(),
    validateRequest
  ],
  authController.login
);

router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  [
    body('email').isEmail(),
    validateRequest
  ],
  authController.forgotPassword
);

router.post(
  '/reset-password',
  [
    body('email').isEmail(),
    body('otp').isString().isLength({ min: 6, max: 6 }),
    body('new_password').isString().isLength({ min: 8 }),
    validateRequest
  ],
  authController.resetPassword
);

export default router;
