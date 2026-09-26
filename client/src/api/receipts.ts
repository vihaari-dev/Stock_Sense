import apiClient from './client';
import type { ReceiptDetail, ReceiptRow, ReceiptLineRow } from '../types/receipt';

export const fetchReceipts = async (): Promise<ReceiptDetail[]> => {
  const { data } = await apiClient.get<ReceiptDetail[]>('/receipts');
  return data;
};

export const fetchReceiptById = async (id: number): Promise<ReceiptDetail> => {
  const { data } = await apiClient.get<ReceiptDetail>(`/receipts/${id}`);
  return data;
};

export const createReceipt = async (payload: { warehouse_id: number; destination_location_id?: number | null }): Promise<ReceiptRow> => {
  const { data } = await apiClient.post<ReceiptRow>('/receipts', payload);
  return data;
};

export const updateReceipt = async ({ id, payload }: { id: number; payload: any }): Promise<ReceiptRow> => {
  const { data } = await apiClient.patch<ReceiptRow>(`/receipts/${id}`, payload);
  return data;
};

export const addLine = async ({ id, payload }: { id: number; payload: { product_id: number; qty_expected: number; unit_cost: number } }): Promise<ReceiptLineRow> => {
  const { data } = await apiClient.post<ReceiptLineRow>(`/receipts/${id}/lines`, payload);
  return data;
};

export const updateLineQty = async ({ id, lineId, qty_received }: { id: number; lineId: number; qty_received: number }): Promise<ReceiptLineRow> => {
  const { data } = await apiClient.patch<ReceiptLineRow>(`/receipts/${id}/lines/${lineId}`, { qty_received });
  return data;
};

export const removeLine = async ({ id, lineId }: { id: number; lineId: number }): Promise<void> => {
  await apiClient.delete(`/receipts/${id}/lines/${lineId}`);
};

export const validateReceipt = async (id: number): Promise<ReceiptRow> => {
  const { data } = await apiClient.post<ReceiptRow>(`/receipts/${id}/validate`);
  return data;
};
