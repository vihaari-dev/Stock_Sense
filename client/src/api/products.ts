import axios from 'axios';
import type {
  Product,
  ProductsListResponse,
  ProductCreatePayload,
  ProductUpdatePayload,
  Category,
  UnitOfMeasure,
  StockBreakdownRow,
} from '../types/product';

const api = axios.create({ baseURL: '/api/v1', withCredentials: true });

// ── Products ─────────────────────────────────────────────────────────────────

export async function fetchProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: number;
  is_active?: boolean | null;
}): Promise<ProductsListResponse> {
  const query: Record<string, string | number> = {};
  if (params.page)        query.page        = params.page;
  if (params.limit)       query.limit       = params.limit;
  if (params.search)      query.search      = params.search;
  if (params.category_id) query.category_id = params.category_id;
  if (params.is_active != null) query.is_active = params.is_active ? '1' : '0';

  const res = await api.get<ProductsListResponse>('/products', { params: query });
  return res.data;
}

export async function fetchProduct(id: number): Promise<Product> {
  const res = await api.get<{ data: Product }>(`/products/${id}`);
  return res.data.data;
}

export async function createProduct(payload: ProductCreatePayload): Promise<Product> {
  const res = await api.post<{ data: Product }>('/products', payload);
  return res.data.data;
}

export async function updateProduct(id: number, payload: ProductUpdatePayload): Promise<Product> {
  const res = await api.patch<{ data: Product }>(`/products/${id}`, payload);
  return res.data.data;
}

export async function deactivateProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function fetchProductStock(id: number): Promise<StockBreakdownRow[]> {
  const res = await api.get<{ data: StockBreakdownRow[] }>(`/products/${id}/stock`);
  return res.data.data;
}

// ── Categories ───────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const res = await api.get<{ data: Category[] }>('/categories');
  return res.data.data;
}

// ── Units of Measure ─────────────────────────────────────────────────────────

export async function fetchUOM(): Promise<UnitOfMeasure[]> {
  const res = await api.get<{ data: UnitOfMeasure[] }>('/uom');
  return res.data.data;
}
