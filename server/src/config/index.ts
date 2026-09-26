import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '5000', 10),

  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    name: process.env.DB_NAME ?? 'stocksense_dev',
    user: process.env.DB_USER ?? 'root',
    pass: process.env.DB_PASS ?? '',
  },

  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshExpiryDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? '7', 10),
  },

  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
  },

  otp: {
    expiresMinutes: parseInt(process.env.OTP_EXPIRES_MINUTES ?? '15', 10),
  },

  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'StockSense <no-reply@stocksense.local>',
  },

  cors: {
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  },
};
