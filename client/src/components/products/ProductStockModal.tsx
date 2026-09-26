import { useEffect, useState } from 'react';
import type { Product, StockBreakdownRow } from '../../types/product';
import { fetchProductStock } from '../../api/products';

interface Props {
  product: Product;
  onClose: () => void;
}

export function ProductStockModal({ product, onClose }: Props) {
  const [rows, setRows] = useState<StockBreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductStock(product.id)
      .then(setRows)
      .catch(() => setError('Failed to load stock data.'))
      .finally(() => setLoading(false));
  }, [product.id]);

  const totalOnHand    = rows.reduce((s, r) => s + r.on_hand,    0);
  const totalReserved  = rows.reduce((s, r) => s + r.reserved,   0);
  const totalFreeToUse = rows.reduce((s, r) => s + r.free_to_use,0);

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-dialog pm-dialog-wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="pm-dialog-header">
          <div>
            <h2>Stock Levels</h2>
            <p className="pm-dialog-subtitle">{product.name} &mdash; {product.sku}</p>
          </div>
          <button className="pm-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {loading && <div className="pm-loading-msg">Loading stock data…</div>}
        {error   && <div className="pm-error-banner">{error}</div>}

        {!loading && !error && (
          <>
            {rows.length === 0 ? (
              <div className="pm-empty-state">
                <span className="pm-empty-icon">📦</span>
                <p>No stock recorded for this product yet.</p>
              </div>
            ) : (
              <div className="pm-table-wrapper">
                <table className="pm-table" id="stock-table">
                  <thead>
                    <tr>
                      <th>Warehouse</th>
                      <th>Location</th>
                      <th className="pm-num">On Hand</th>
                      <th className="pm-num">Reserved</th>
                      <th className="pm-num">Free to Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.location_id}>
                        <td>
                          <span className="pm-badge">{r.location.warehouse.code}</span>
                          {r.location.warehouse.name}
                        </td>
                        <td>
                          <span className="pm-badge pm-badge-loc">{r.location.code}</span>
                          {r.location.name}
                        </td>
                        <td className="pm-num">{r.on_hand.toLocaleString()}</td>
                        <td className="pm-num pm-reserved">{r.reserved.toLocaleString()}</td>
                        <td className="pm-num pm-free">
                          <strong>{r.free_to_use.toLocaleString()}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="pm-tfoot">
                      <td colSpan={2}><strong>Total</strong></td>
                      <td className="pm-num"><strong>{totalOnHand.toLocaleString()}</strong></td>
                      <td className="pm-num pm-reserved"><strong>{totalReserved.toLocaleString()}</strong></td>
                      <td className="pm-num pm-free"><strong>{totalFreeToUse.toLocaleString()}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}

        <div className="pm-dialog-footer">
          <button className="pm-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
