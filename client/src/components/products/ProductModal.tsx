import React, { useEffect, useState } from 'react';
import type { Product, Category, UnitOfMeasure, ProductCreatePayload } from '../../types/product';
import { createProduct, updateProduct } from '../../api/products';

interface Props {
  mode: 'create' | 'edit';
  product?: Product;
  categories: Category[];
  uoms: UnitOfMeasure[];
  onClose: () => void;
  onSaved: () => void;
}

const initialForm = {
  sku: '',
  name: '',
  description: '',
  category_id: '',
  uom_id: '',
  unit_cost: '',
  reorder_point: '0',
  reorder_qty: '0',
};

export function ProductModal({ mode, product, categories, uoms, onClose, onSaved }: Props) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && product) {
      setForm({
        sku: product.sku,
        name: product.name,
        description: product.description ?? '',
        category_id: String(product.category_id),
        uom_id: String(product.uom_id),
        unit_cost: product.unit_cost,
        reorder_point: String(product.reorder_point),
        reorder_qty: String(product.reorder_qty),
      });
    }
  }, [mode, product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: ProductCreatePayload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category_id: parseInt(form.category_id),
        uom_id: parseInt(form.uom_id),
        unit_cost: parseFloat(form.unit_cost) || 0,
        reorder_point: parseInt(form.reorder_point) || 0,
        reorder_qty: parseInt(form.reorder_qty) || 0,
      };

      if (mode === 'create') {
        await createProduct(payload);
      } else if (product) {
        await updateProduct(product.id, payload);
      }

      onSaved();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={mode === 'create' ? 'Create Product' : 'Edit Product'}>
        <div className="pm-dialog-header">
          <h2>{mode === 'create' ? 'New Product' : 'Edit Product'}</h2>
          <button className="pm-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {error && <div className="pm-error-banner">{error}</div>}

        <form className="pm-form" onSubmit={handleSubmit} id="product-form">
          <div className="pm-form-row">
            <div className="pm-form-group">
              <label htmlFor="prod-sku">SKU <span className="pm-required">*</span></label>
              <input id="prod-sku" name="sku" value={form.sku} onChange={handleChange} required placeholder="e.g. SKU-001" />
            </div>
            <div className="pm-form-group pm-grow">
              <label htmlFor="prod-name">Product Name <span className="pm-required">*</span></label>
              <input id="prod-name" name="name" value={form.name} onChange={handleChange} required placeholder="Full product name" />
            </div>
          </div>

          <div className="pm-form-group">
            <label htmlFor="prod-desc">Description</label>
            <textarea id="prod-desc" name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Optional product description" />
          </div>

          <div className="pm-form-row">
            <div className="pm-form-group pm-grow">
              <label htmlFor="prod-category">Category <span className="pm-required">*</span></label>
              <select id="prod-category" name="category_id" value={form.category_id} onChange={handleChange} required>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="pm-form-group pm-grow">
              <label htmlFor="prod-uom">Unit of Measure <span className="pm-required">*</span></label>
              <select id="prod-uom" name="uom_id" value={form.uom_id} onChange={handleChange} required>
                <option value="">Select UOM</option>
                {uoms.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pm-form-row">
            <div className="pm-form-group">
              <label htmlFor="prod-cost">Unit Cost <span className="pm-required">*</span></label>
              <input id="prod-cost" name="unit_cost" type="number" min="0" step="0.0001" value={form.unit_cost} onChange={handleChange} required placeholder="0.00" />
            </div>
            <div className="pm-form-group">
              <label htmlFor="prod-reorder-pt">Reorder Point</label>
              <input id="prod-reorder-pt" name="reorder_point" type="number" min="0" step="1" value={form.reorder_point} onChange={handleChange} />
            </div>
            <div className="pm-form-group">
              <label htmlFor="prod-reorder-qty">Reorder Qty</label>
              <input id="prod-reorder-qty" name="reorder_qty" type="number" min="0" step="1" value={form.reorder_qty} onChange={handleChange} />
            </div>
          </div>
        </form>

        <div className="pm-dialog-footer">
          <button className="pm-btn-ghost" type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="pm-btn-primary" type="submit" form="product-form" disabled={saving}>
            {saving ? 'Saving…' : mode === 'create' ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
