import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchReceipts, createReceipt, validateReceipt, addLine, updateLineQty } from '../api/receipts';
import type { ReceiptDetail } from '../types/receipt';
import './ReceiptsPage.css';

export const ReceiptsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptDetail | null>(null);

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: fetchReceipts,
  });

  const createMut = useMutation({
    mutationFn: createReceipt,
    onSuccess: (newReceipt) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      // In a real app with proper master data, we wouldn't hardcode warehouse_id 1
      // but since we lack UI for it, we rely on the DB having some seeds or fail gracefully.
    },
    onError: (err: any) => alert(err.response?.data?.error?.message || 'Failed to create receipt')
  });

  const validateMut = useMutation({
    mutationFn: validateReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setSelectedReceipt(null);
    },
    onError: (err: any) => alert(err.response?.data?.error?.message || 'Failed to validate receipt')
  });

  const handleCreate = () => {
    // Hardcoding IDs 1 for now since we have no Warehouse/Location selection UI yet
    createMut.mutate({ warehouse_id: 1, destination_location_id: 1 });
  };

  const handleValidate = (id: number) => {
    if (window.confirm('Validate this receipt? This will permanently increase stock.')) {
      validateMut.mutate(id);
    }
  };

  if (isLoading) return <div style={{ padding: '2rem', color: 'white' }}>Loading receipts...</div>;

  return (
    <div className="receipts-page">
      <header className="receipts-header">
        <div>
          <h1>Receipts</h1>
          <p>Incoming goods from suppliers</p>
        </div>
        <button className="btn-primary" onClick={handleCreate} disabled={createMut.isPending}>
          + New Receipt
        </button>
      </header>

      <div className="receipts-layout">
        <div className="receipts-list">
          {receipts.length === 0 ? (
            <p style={{ color: '#94a3b8', padding: '1rem' }}>No receipts found.</p>
          ) : (
            receipts.map(rcpt => (
              <div 
                key={rcpt.id} 
                className={`receipt-card ${selectedReceipt?.id === rcpt.id ? 'active' : ''}`}
                onClick={() => setSelectedReceipt(rcpt)}
              >
                <div className="rcpt-ref">{rcpt.reference}</div>
                <div className="rcpt-meta">
                  <span className={`status-badge ${rcpt.status}`}>{rcpt.status}</span>
                  <span className="date">{new Date(rcpt.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="receipt-detail">
          {selectedReceipt ? (
            <div className="detail-panel">
              <h2>{selectedReceipt.reference}</h2>
              <div className="detail-meta">
                <div><strong>Status:</strong> <span className={`status-badge ${selectedReceipt.status}`}>{selectedReceipt.status}</span></div>
                <div><strong>Warehouse ID:</strong> {selectedReceipt.warehouse_id}</div>
                <div><strong>Location ID:</strong> {selectedReceipt.destination_location_id || 'Not set'}</div>
              </div>

              <h3>Products</h3>
              <table className="lines-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Expected</th>
                    <th>Received</th>
                    <th>Unit Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReceipt.lines?.length === 0 ? (
                    <tr><td colSpan={4}>No products added yet.</td></tr>
                  ) : (
                    selectedReceipt.lines?.map(line => (
                      <tr key={line.id}>
                        <td>{line.product_id}</td>
                        <td>{line.qty_expected}</td>
                        <td>{line.qty_received}</td>
                        <td>${Number(line.unit_cost).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {selectedReceipt.status !== 'done' && selectedReceipt.status !== 'canceled' && (
                <div className="detail-actions">
                  <button 
                    className="btn-success" 
                    onClick={() => handleValidate(selectedReceipt.id)}
                    disabled={validateMut.isPending || !selectedReceipt.lines?.length}
                  >
                    Validate & Receive Stock
                  </button>
                  <p className="hint">Note: You need Products and Locations in the DB to fully use this.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">Select a receipt to view details</div>
          )}
        </div>
      </div>
    </div>
  );
};
