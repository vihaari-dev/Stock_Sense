import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deliveriesApi, type Delivery } from '../../api/deliveries';
import { getWarehouses, type Warehouse } from '../../api/warehouses';

const DeliveryForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  const [formData, setFormData] = useState({
    warehouse_id: '',
    contact_id: '',
    delivery_address: '',
    scheduled_date: '',
    notes: '',
  });
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWarehouses();
    if (isEdit) {
      fetchDelivery();
    }
  }, [id]);

  const fetchWarehouses = async () => {
    try {
      const data = await getWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDelivery = async () => {
    try {
      const data = await deliveriesApi.get(Number(id));
      setDelivery(data);
      setFormData({
        warehouse_id: data.warehouse_id.toString(),
        contact_id: data.contact_id ? data.contact_id.toString() : '',
        delivery_address: data.delivery_address || '',
        scheduled_date: data.scheduled_date || '',
        notes: data.notes || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload: Partial<Delivery> = {
        warehouse_id: Number(formData.warehouse_id),
        contact_id: formData.contact_id ? Number(formData.contact_id) : undefined,
        delivery_address: formData.delivery_address || undefined,
        scheduled_date: formData.scheduled_date || undefined,
        notes: formData.notes || undefined,
      };

      if (isEdit) {
        await deliveriesApi.update(Number(id), payload);
        // Refresh
        fetchDelivery();
        alert('Delivery updated!');
      } else {
        const created = await deliveriesApi.create(payload);
        navigate(`/deliveries/${created.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save delivery');
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (action: 'validate' | 'complete') => {
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      if (action === 'validate') await deliveriesApi.validate(Number(id));
      if (action === 'complete') await deliveriesApi.complete(Number(id));
      fetchDelivery();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || `Failed to ${action} delivery`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>{isEdit ? `Delivery Order: ${delivery?.reference}` : 'New Delivery Order'}</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/deliveries')}>Back to List</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Warehouse</label>
              <select 
                name="warehouse_id" 
                value={formData.warehouse_id} 
                onChange={handleChange} 
                required 
                disabled={isEdit} // Cannot change warehouse once created
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Scheduled Date</label>
              <input 
                type="date" 
                name="scheduled_date" 
                value={formData.scheduled_date} 
                onChange={handleChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Delivery Address</label>
              <input 
                type="text" 
                name="delivery_address" 
                value={formData.delivery_address} 
                onChange={handleChange}
                placeholder="Shipping address"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Notes</label>
              <textarea 
                name="notes" 
                value={formData.notes} 
                onChange={handleChange}
                rows={3}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Header'}
          </button>
        </form>
      </div>

      {isEdit && delivery && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Lines & Actions</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ padding: '8px', backgroundColor: '#eee', borderRadius: '4px', fontWeight: 'bold' }}>
                Status: {delivery.status.toUpperCase()}
              </span>
              {delivery.status === 'draft' && (
                <button className="btn btn-primary" onClick={() => handleAction('validate')} disabled={saving}>Validate</button>
              )}
              {delivery.status === 'ready' && (
                <button className="btn btn-success" onClick={() => handleAction('complete')} disabled={saving} style={{ backgroundColor: '#28a745', color: 'white' }}>Complete</button>
              )}
            </div>
          </div>
          
          <p><em>(Line item management would go here. For the tracer bullet, we focus on the header and state machine.)</em></p>
        </div>
      )}
    </div>
  );
};

export default DeliveryForm;
