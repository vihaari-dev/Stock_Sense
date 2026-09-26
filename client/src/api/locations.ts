import apiClient from './client';

export type LocationActiveFilter = 'true' | 'false' | 'all';

export interface LocationListItem {
  id: number;
  warehouseId: number;
  name: string;
  code: string;
  isActive: boolean;
  warehouseName: string;
  warehouseCode: string;
  warehouseIsActive: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationStockItem {
  productId: number;
  sku: string;
  productName: string;
  onHand: number;
  reserved: number;
  freeToUse: number;
}

export interface LocationDetail extends LocationListItem {
  stockSummary: LocationStockItem[];
}

export interface LocationListResponse {
  data: LocationListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LocationListParams {
  page: number;
  limit: number;
  search?: string;
  warehouseId?: number;
  isActive: LocationActiveFilter;
}

export async function listLocations(params: LocationListParams): Promise<LocationListResponse> {
  const { data } = await apiClient.get<LocationListResponse>('/locations', { params });
  return data;
}

export async function getLocation(id: number): Promise<LocationDetail> {
  const { data } = await apiClient.get<LocationDetail>(`/locations/${id}`);
  return data;
}