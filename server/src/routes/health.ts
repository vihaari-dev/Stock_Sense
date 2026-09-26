import { Router, Request, Response } from 'express';
import { sequelize } from '../config/database';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected', timestamp: new Date().toISOString() });
  }
});

export default router;
