import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Route imports
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import productsRouter from './routes/products';
import categoriesRouter from './routes/categories';
import uomRouter from './routes/uom';

// Register Sequelize model associations
import './models/index';

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// HTTP request logging
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/uom', uomRouter);

// 404 catch-all
app.use(notFound);

// Global error handler
app.use(
  errorHandler as (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
  ) => void
);

export default app;