import apiClient from './client';

export interface KpiPayload {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  scheduledTransfers: number;
  waitingOperations: number;
}

/**
 * fetchDashboardKpis — typed caller for GET /api/v1/dashboard/kpis.
 * Satisfies AC-5 of spec 0002.
 */
export async function fetchDashboardKpis(): Promise<KpiPayload> {
  const { data } = await apiClient.get<KpiPayload>('/dashboard/kpis');
  return data;
}
