export interface CategoryRow {
  id: number;
  name: string;
  parentId: number | null;
  parentName: string | null;
  productCount: number;
}

export interface CategoryDetail extends CategoryRow {
  children: Array<{ id: number; name: string; productCount: number }>;
}

export interface CategoryListResponse {
  data: CategoryRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CategoryCreatePayload {
  name: string;
  parentId?: number | null;
}

export interface CategoryUpdatePayload {
  name?: string;
  parentId?: number | null;
}
