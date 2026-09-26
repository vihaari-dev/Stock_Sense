import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { getKpis } from '../controllers/dashboardController';

const router = Router();

/**
 * GET /api/v1/dashboard/kpis
 * Both inventory_manager and warehouse_staff are permitted.
 * Satisfies AC-4 of spec 0002.
 */
router.get('/kpis', requireAuth, getKpis);

export default router;
