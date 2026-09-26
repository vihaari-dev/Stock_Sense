// ── Shared TypeScript types for Product Master Data ────────────────────────

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}

export interface UnitOfMeasure {
  id: number;
  name: string;
  abbreviation: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category_id: number;
  uom_id: number;
  unit_cost: string; // DECIMAL comes back as string from MySQL
  reorder_point: number;
  reorder_qty: number;
  is_active: number; // 0 | 1
  created_at: string;
  updated_at: string;
  category?: Category;
  uom?: UnitOfMeasure;
  total_on_hand?: number;
}

export interface StockBreakdownRow {
  location_id: number;
  location: {
    id: number;
    name: string;
    code: string;
    warehouse: {
      id: number;
      name: string;
      code: string;
    };
  };
  on_hand: number;
  reserved: number;
  free_to_use: number;
}

export interface ProductsListResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductCreatePayload {
  sku: string;
  name: string;
  description?: string;
  category_id: number;
  uom_id: number;
  unit_cost: number;
  reorder_point?: number;
  reorder_qty?: number;
}

export interface ProductUpdatePayload extends Partial<ProductCreatePayload> {
  is_active?: boolean;
}
