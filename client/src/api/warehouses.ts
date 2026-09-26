import apiClient from './client';

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWarehousePayload {
  name: string;
  code: string;
  address?: string;
}

export interface UpdateWarehousePayload {
  name?: string;
  code?: string;
  address?: string;
  is_active?: boolean;
}

export const getWarehouses = async (): Promise<Warehouse[]> => {
  const response = await apiClient.get('/warehouses');
  return response.data;
};

export const getWarehouseById = async (id: string): Promise<Warehouse> => {
  const response = await apiClient.get(`/warehouses/${id}`);
  return response.data;
};

export const createWarehouse = async (data: CreateWarehousePayload): Promise<Warehouse> => {
  const response = await apiClient.post('/warehouses', data);
  return response.data;
};

export const updateWarehouse = async (id: string, data: UpdateWarehousePayload): Promise<Warehouse> => {
  const response = await apiClient.put(`/warehouses/${id}`, data);
  return response.data;
};
