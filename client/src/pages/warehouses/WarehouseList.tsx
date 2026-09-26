import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getWarehouses } from '../../api/warehouses';
import type { Warehouse } from '../../api/warehouses';
import { useAuth } from '../../context/AuthContext';

const WarehouseList: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const isManager = user?.role === 'inventory_manager';

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const data = await getWarehouses();
      setWarehouses(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading warehouses...</p></div>;

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Warehouses</h2>
        {isManager && (
          <button className="btn btn-primary" onClick={() => navigate('/warehouses/new')}>
            + New Warehouse
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
              <th style={{ padding: '12px' }}>Code</th>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '12px', textAlign: 'center' }}>No warehouses found.</td>
              </tr>
            ) : (
              warehouses.map((w) => (
                <tr key={w.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{w.code}</td>
                  <td style={{ padding: '12px' }}>{w.name}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.85rem',
                      backgroundColor: w.is_active ? '#d4edda' : '#f8d7da',
                      color: w.is_active ? '#155724' : '#721c24'
                    }}>
                      {w.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {isManager && (
                      <Link to={`/warehouses/${w.id}/edit`} style={{ color: '#0056b3', textDecoration: 'none' }}>Edit</Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WarehouseList;
