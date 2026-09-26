import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User, RefreshToken, OtpCode } from '../models';
import { hashPassword, verifyPassword, generateRandomToken, hashToken, generateOtp } from '../utils/crypto';
import { config } from '../config';
import { sequelize } from '../config/database';
// SMTP mail OTP will be provided later, skipping actual email send logic for now.

const REFRESH_COOKIE_NAME = 'refreshToken';

export async function signup(req: Request, res: Response): Promise<void> {
  const { login_id, email, password, role, full_name } = req.body;

  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ login_id }, { email }],
    },
  });

  if (existingUser) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'login_id or email already in use' } });
    return;
  }

  const hashedPassword = await hashPassword(password);
  
  const user = await User.create({
    login_id,
    email,
    password_hash: hashedPassword,
    role,
    full_name,
  });

  res.status(201).json({
    data: {
      id: user.id,
      login_id: user.login_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      is_active: user.is_active,
      created_at: user.created_at,
    }
  });
}

function generateTokens(user: User): { accessToken: string, refreshTokenStr: string } {
  const accessToken = jwt.sign(
    { sub: user.id, loginId: user.login_id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  );

  const refreshTokenStr = generateRandomToken();
  return { accessToken, refreshTokenStr };
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: 'strict',
    maxAge: config.jwt.refreshExpiryDays * 24 * 60 * 60 * 1000,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { login_id, password } = req.body;

  const user = await User.findOne({ where: { login_id } });
  if (!user || !user.is_active) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    return;
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    return;
  }

  const { accessToken, refreshTokenStr } = generateTokens(user);
  
  const hashedToken = hashToken(refreshTokenStr);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshExpiryDays);

  await RefreshToken.create({
    user_id: user.id,
    token_hash: hashedToken,
    expires_at: expiresAt,
  });

  setRefreshCookie(res, refreshTokenStr);
  res.json({ data: { accessToken } });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const oldTokenStr = req.cookies[REFRESH_COOKIE_NAME];
  if (!oldTokenStr) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });
    return;
  }

  const hashedOldToken = hashToken(oldTokenStr);

  const t = await sequelize.transaction();
  try {
    const oldToken = await RefreshToken.findOne({
      where: { token_hash: hashedOldToken },
      transaction: t,
    });

    if (!oldToken || oldToken.revoked_at || oldToken.expires_at < new Date()) {
      await t.rollback();
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' } });
      return;
    }

    const user = await User.findByPk(oldToken.user_id, { transaction: t });
    if (!user || !user.is_active) {
      await t.rollback();
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User inactive or not found' } });
      return;
    }

    oldToken.revoked_at = new Date();
    await oldToken.save({ transaction: t });

    const { accessToken, refreshTokenStr } = generateTokens(user);
    const hashedNewToken = hashToken(refreshTokenStr);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshExpiryDays);

    await RefreshToken.create({
      user_id: user.id,
      token_hash: hashedNewToken,
      expires_at: expiresAt,
    }, { transaction: t });

    await t.commit();

    setRefreshCookie(res, refreshTokenStr);
    res.json({ data: { accessToken } });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to refresh token' } });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const oldTokenStr = req.cookies[REFRESH_COOKIE_NAME];
  if (oldTokenStr) {
    const hashedOldToken = hashToken(oldTokenStr);
    await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { token_hash: hashedOldToken } }
    );
  }
  res.clearCookie(REFRESH_COOKIE_NAME);
  res.json({ data: { message: 'Logged out successfully' } });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  
  // Generic response to avoid email enumeration
  if (user) {
    const otp = generateOtp();
    const otpHash = hashToken(otp);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.otp.expiresMinutes);

    await OtpCode.create({
      user_id: user.id,
      code_hash: otpHash,
      expires_at: expiresAt,
    });

    // TODO: Send OTP via SMTP
    // For now we log it in development (would remove in production)
    if (config.env === 'development') {
      console.log(`Development OTP for ${email}: ${otp}`);
    }
  }

  res.json({ data: { message: 'If that email is registered, a password reset OTP has been sent.' } });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, otp, new_password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid OTP or email' } });
    return;
  }

  const otpHash = hashToken(otp);
  const code = await OtpCode.findOne({
    where: { user_id: user.id, code_hash: otpHash, used_at: null },
  });

  if (!code || code.expires_at < new Date()) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid or expired OTP' } });
    return;
  }

  const t = await sequelize.transaction();
  try {
    code.used_at = new Date();
    await code.save({ transaction: t });

    user.password_hash = await hashPassword(new_password);
    await user.save({ transaction: t });

    // Revoke all refresh tokens for this user upon password reset
    await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { user_id: user.id, revoked_at: null }, transaction: t }
    );

    await t.commit();
    res.json({ data: { message: 'Password reset successful' } });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to reset password' } });
  }
}
