import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { deliveriesApi, type Delivery } from '../../api/deliveries';


const statusColors = {
  draft: { bg: '#e2e3e5', text: '#383d41' },
  waiting: { bg: '#fff3cd', text: '#856404' },
  ready: { bg: '#cce5ff', text: '#004085' },
  done: { bg: '#d4edda', text: '#155724' },
  canceled: { bg: '#f8d7da', text: '#721c24' },
};

const DeliveryList: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const data = await deliveriesApi.list();
      setDeliveries(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading deliveries...</p></div>;

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Delivery Orders</h2>
        <button className="btn btn-primary" onClick={() => navigate('/deliveries/new')}>
          + New Delivery
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
              <th style={{ padding: '12px' }}>Reference</th>
              <th style={{ padding: '12px' }}>Warehouse</th>
              <th style={{ padding: '12px' }}>Contact</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Scheduled Date</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '12px', textAlign: 'center' }}>No delivery orders found.</td>
              </tr>
            ) : (
              deliveries.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{d.reference}</td>
                  <td style={{ padding: '12px' }}>{d.warehouse?.name || `ID: ${d.warehouse_id}`}</td>
                  <td style={{ padding: '12px' }}>{d.contact?.name || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.85rem',
                      backgroundColor: statusColors[d.status].bg,
                      color: statusColors[d.status].text
                    }}>
                      {d.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{d.scheduled_date || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <Link to={`/deliveries/${d.id}`} style={{ color: '#0056b3', textDecoration: 'none' }}>View / Edit</Link>
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

export default DeliveryList;
