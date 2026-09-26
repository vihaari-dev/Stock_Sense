import { Request, Response, NextFunction } from 'express';
import { getDashboardKpis } from '../services/dashboardService';

/**
 * GET /api/v1/dashboard/kpis
 * Returns KPI counts for the operational dashboard.
 * Auth: requireAuth (both roles).
 * Satisfies AC-1 of spec 0002.
 */
export async function getKpis(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const kpis = await getDashboardKpis();
    res.json(kpis);
  } catch (err) {
    next(err);
  }
}
