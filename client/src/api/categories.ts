import apiClient from './client';
import type {
  CategoryListResponse,
  CategoryDetail,
  CategoryCreatePayload,
  CategoryUpdatePayload,
  CategoryRow
} from '../types/category';

export const fetchCategories = async (page = 1, limit = 50): Promise<CategoryListResponse> => {
  const { data } = await apiClient.get<CategoryListResponse>('/categories', {
    params: { page, limit }
  });
  return data;
};

export const fetchCategoryById = async (id: number): Promise<CategoryDetail> => {
  const { data } = await apiClient.get<CategoryDetail>(`/categories/${id}`);
  return data;
};

export const createCategory = async (payload: CategoryCreatePayload): Promise<CategoryRow> => {
  const { data } = await apiClient.post<CategoryRow>('/categories', payload);
  return data;
};

export const updateCategory = async ({ id, payload }: { id: number; payload: CategoryUpdatePayload }): Promise<CategoryRow> => {
  const { data } = await apiClient.patch<CategoryRow>(`/categories/${id}`, payload);
  return data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/categories/${id}`);
};
