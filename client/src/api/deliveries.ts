import apiClient from './client';

export interface DeliveryLine {
  id: number;
  delivery_id: number;
  product_id: number;
  qty_requested: number;
  qty_delivered: number;
  is_available: boolean;
  product?: {
    id: number;
    sku: string;
    name: string;
    unit_cost: number;
  };
}

export interface Delivery {
  id: number;
  reference: string;
  warehouse_id: number;
  source_location_id: number | null;
  contact_id: number | null;
  delivery_address: string | null;
  responsible_user_id: number;
  status: 'draft' | 'waiting' | 'ready' | 'done' | 'canceled';
  scheduled_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  warehouse?: { id: number; name: string; code: string };
  contact?: { id: number; name: string };
  user?: { id: number; full_name: string };
  lines?: DeliveryLine[];
}

export const deliveriesApi = {
  list: async (params?: { status?: string; warehouse_id?: number }) => {
    const response = await apiClient.get<Delivery[]>('/deliveries', { params });
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get<Delivery>(`/deliveries/${id}`);
    return response.data;
  },

  create: async (data: Partial<Delivery>) => {
    const response = await apiClient.post<Delivery>('/deliveries', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Delivery>) => {
    const response = await apiClient.put<Delivery>(`/deliveries/${id}`, data);
    return response.data;
  },

  addLine: async (id: number, data: { product_id: number; qty_requested: number }) => {
    const response = await apiClient.post<DeliveryLine>(`/deliveries/${id}/lines`, data);
    return response.data;
  },

  validate: async (id: number) => {
    const response = await apiClient.post<Delivery>(`/deliveries/${id}/validate`);
    return response.data;
  },

  complete: async (id: number) => {
    const response = await apiClient.post<Delivery>(`/deliveries/${id}/complete`);
    return response.data;
  }
};
