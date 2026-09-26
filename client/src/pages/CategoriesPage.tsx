import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';
import type { CategoryRow } from '../types/category';
import './CategoriesPage.css';

export const CategoriesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isManager = user?.role === 'inventory_manager';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [formData, setFormData] = useState({ name: '', parentId: '' });
  const [formError, setFormError] = useState('');

  // Fetch categories
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(1, 100), // using 100 for MVP flat list
  });

  const categories = data?.data || [];

  // Mutations
  const createMut = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeModal();
    },
    onError: (error: any) => {
      setFormError(error.response?.data?.error?.message || 'Failed to create category');
    }
  });

  const updateMut = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeModal();
    },
    onError: (error: any) => {
      setFormError(error.response?.data?.error?.message || 'Failed to update category');
    }
  });

  const deleteMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Failed to delete category');
    }
  });

  // Handlers
  const openModal = (category?: CategoryRow) => {
    setFormError('');
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, parentId: category.parentId ? String(category.parentId) : '' });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', parentId: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    const payload = {
      name: formData.name,
      parentId: formData.parentId ? Number(formData.parentId) : null,
    };

    if (editingCategory) {
      updateMut.mutate({ id: editingCategory.id, payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteMut.mutate(id);
    }
  };

  // Filter out self and current children so they can't be selected as parent (prevents cycles)
  const availableParents = categories.filter(c => 
    !editingCategory || (c.id !== editingCategory.id && c.parentId !== editingCategory.id)
  );

  return (
    <div className="categories-page">
      <header className="categories-header">
        <div>
          <h1>Categories</h1>
          <p>Manage product classifications</p>
        </div>
        {isManager && (
          <button className="btn-primary" onClick={() => openModal()}>
            + New Category
          </button>
        )}
      </header>

      <div className="table-container">
        <table className="categories-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Parent</th>
              <th>Products</th>
              {isManager && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={isManager ? 4 : 3}>Loading...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={isManager ? 4 : 3}>No categories found.</td></tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.id}>
                  <td>{cat.name}</td>
                  <td>
                    {cat.parentName ? (
                      <span className="badge">{cat.parentName}</span>
                    ) : (
                      <span style={{ color: '#64748b' }}>—</span>
                    )}
                  </td>
                  <td>{cat.productCount}</td>
                  {isManager && (
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon" 
                          onClick={() => openModal(cat)}
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button 
                          className="btn-icon delete" 
                          onClick={() => handleDelete(cat.id)}
                          disabled={cat.productCount > 0 || categories.some(c => c.parentId === cat.id)}
                          title={cat.productCount > 0 ? "Cannot delete: products attached" : categories.some(c => c.parentId === cat.id) ? "Cannot delete: has sub-categories" : "Delete"}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingCategory ? 'Edit Category' : 'New Category'}</h2>
            
            {formError && <div className="error-message">{formError}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label>Parent Category (Optional)</label>
                <select 
                  className="form-select"
                  value={formData.parentId}
                  onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                >
                  <option value="">None (Top-level)</option>
                  {availableParents.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={createMut.isPending || updateMut.isPending}
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
