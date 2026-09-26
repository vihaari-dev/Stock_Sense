import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Route imports (stubs — feature routes added as each feature is built)
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import dashboardRouter from './routes/dashboard';
import categoriesRouter from './routes/categories';

const app = express();

// Trust proxy (needed when behind nginx/Railway/Render in prod)
app.set('trust proxy', 1);

// CORS — only allow the configured client origin
app.use(cors({
  origin: config.cors.origin,
  credentials: true, // Required for HttpOnly cookie exchange
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser (refresh token arrives as HttpOnly cookie)
app.use(cookieParser());

// HTTP request logging via morgan → pipes into winston
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/categories', categoriesRouter);

// 404 catch-all — must come after all route mounts
app.use(notFound);

// Global error handler — must be last middleware
app.use(errorHandler as (err: unknown, req: Request, res: Response, next: NextFunction) => void);

export default app;
