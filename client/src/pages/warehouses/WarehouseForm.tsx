import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWarehouseById, createWarehouse, updateWarehouse } from '../../api/warehouses';
import type { CreateWarehousePayload, UpdateWarehousePayload } from '../../api/warehouses';

const WarehouseForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      fetchWarehouse(id);
    }
  }, [id, isEdit]);

  const fetchWarehouse = async (warehouseId: string) => {
    try {
      const data = await getWarehouseById(warehouseId);
      setFormData({
        name: data.name,
        code: data.code,
        address: data.address || '',
        is_active: data.is_active,
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load warehouse');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    
    try {
      if (isEdit && id) {
        const payload: UpdateWarehousePayload = { ...formData };
        await updateWarehouse(id, payload);
      } else {
        const payload: CreateWarehousePayload = { ...formData };
        await createWarehouse(payload);
      }
      navigate('/warehouses');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || (err.response?.data?.error?.details?.[0]?.msg) || 'Failed to save warehouse');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>{isEdit ? 'Edit Warehouse' : 'New Warehouse'}</h2>
      
      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      
      <div className="card">
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Warehouse Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="code">Short Code (2-10 chars) *</label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={10}
              className="form-control"
              style={{ textTransform: 'uppercase' }}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-control"
              rows={3}
            />
          </div>
          
          {isEdit && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <label htmlFor="is_active" style={{ marginBottom: 0 }}>Active Warehouse</label>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Warehouse'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/warehouses')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarehouseForm;
