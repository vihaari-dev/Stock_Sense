import { useCallback, useEffect, useState } from 'react';
import type { Product, Category, UnitOfMeasure } from '../types/product';
import {
  fetchProducts,
  fetchCategories,
  fetchUOM,
  deactivateProduct,
} from '../api/products';
import { ProductModal } from '../components/products/ProductModal';
import { ProductStockModal } from '../components/products/ProductStockModal';

type ActiveFilter = 'all' | 'active' | 'inactive';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  const loadReferenceData = useCallback(async () => {
    const [cats, uomList] = await Promise.all([fetchCategories(), fetchUOM()]);
    setCategories(cats);
    setUoms(uomList);
  }, []);

  const loadProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const isActiveParam =
        activeFilter === 'active'   ? true :
        activeFilter === 'inactive' ? false : null;

      const result = await fetchProducts({
        page,
        limit: meta.limit,
        search: search || undefined,
        category_id: categoryFilter,
        is_active: isActiveParam,
      });
      setProducts(result.data);
      setMeta(result.meta);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, activeFilter, meta.limit]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadProducts(1);
  }, [search, categoryFilter, activeFilter, loadReferenceData]);

  const handleDeactivate = async (p: Product) => {
    if (!confirm(`Deactivate "${p.name}"? It will be hidden from active inventory.`)) return;
    await deactivateProduct(p.id);
    loadProducts(meta.page);
  };

  const handleSaved = () => {
    setCreateOpen(false);
    setEditProduct(null);
    loadProducts(meta.page);
  };

  const activeCount   = products.filter((p) => p.is_active).length;
  const totalOnHand   = products.reduce((s, p) => s + (Number(p.total_on_hand) || 0), 0);
  const lowStockCount = products.filter((p) => p.reorder_point > 0 && Number(p.total_on_hand) <= p.reorder_point).length;

  return (
    <main className="pp-page">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="pp-header">
        <div>
          <h1 className="pp-title">Products</h1>
          <p className="pp-subtitle">Master catalog — manage SKUs, costs, and reorder rules</p>
        </div>
        <button id="btn-create-product" className="pp-btn-primary" onClick={() => setCreateOpen(true)}>
          + New Product
        </button>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────────── */}
      <div className="pp-cards">
        <div className="pp-card">
          <span className="pp-card-label">Total Products</span>
          <span className="pp-card-value">{meta.total.toLocaleString()}</span>
        </div>
        <div className="pp-card">
          <span className="pp-card-label">Active</span>
          <span className="pp-card-value pp-green">{activeCount.toLocaleString()}</span>
        </div>
        <div className="pp-card">
          <span className="pp-card-label">Total On Hand</span>
          <span className="pp-card-value">{totalOnHand.toLocaleString()}</span>
        </div>
        <div className="pp-card">
          <span className="pp-card-label">Low Stock Alerts</span>
          <span className={`pp-card-value ${lowStockCount > 0 ? 'pp-amber' : ''}`}>
            {lowStockCount}
          </span>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="pp-filters">
        <div className="pp-search-wrap">
          <span className="pp-search-icon">🔍</span>
          <input
            id="product-search"
            className="pp-search"
            type="text"
            placeholder="Search SKU or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="pp-clear-btn" onClick={() => setSearch('')} aria-label="Clear search">✕</button>
          )}
        </div>

        <select
          id="filter-category"
          className="pp-select"
          value={categoryFilter ?? ''}
          onChange={(e) => setCategoryFilter(e.target.value ? parseInt(e.target.value) : undefined)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="pp-toggle-group" role="group" aria-label="Active status filter">
          {(['all', 'active', 'inactive'] as ActiveFilter[]).map((f) => (
            <button
              key={f}
              id={`filter-status-${f}`}
              className={`pp-toggle ${activeFilter === f ? 'pp-toggle-active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="pp-table-card">
        {loading ? (
          <div className="pp-loading">
            <div className="pp-spinner" />
            <span>Loading products…</span>
          </div>
        ) : products.length === 0 ? (
          <div className="pp-empty">
            <span className="pp-empty-icon">📦</span>
            <h3>No products found</h3>
            <p>Try adjusting your filters or create a new product.</p>
            <button className="pp-btn-primary" onClick={() => setCreateOpen(true)}>Create First Product</button>
          </div>
        ) : (
          <div className="pp-scroll">
            <table className="pp-table" id="products-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>UOM</th>
                  <th className="pp-num">Unit Cost</th>
                  <th className="pp-num">On Hand</th>
                  <th className="pp-num">Reorder Pt.</th>
                  <th>Status</th>
                  <th className="pp-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const onHand = Number(p.total_on_hand) || 0;
                  const isLowStock = p.reorder_point > 0 && onHand <= p.reorder_point;
                  return (
                    <tr key={p.id} className={isLowStock ? 'pp-row-warn' : ''}>
                      <td><span className="pp-sku">{p.sku}</span></td>
                      <td className="pp-product-name">
                        <span>{p.name}</span>
                        {p.description && <small className="pp-desc-preview">{p.description.slice(0, 60)}{p.description.length > 60 ? '…' : ''}</small>}
                      </td>
                      <td>{p.category?.name ?? '—'}</td>
                      <td>{p.uom ? `${p.uom.name} (${p.uom.abbreviation})` : '—'}</td>
                      <td className="pp-num">${Number(p.unit_cost).toFixed(2)}</td>
                      <td className={`pp-num ${isLowStock ? 'pp-low-stock' : ''}`}>
                        {isLowStock && <span className="pp-alert-dot" title="Low stock" />}
                        {onHand.toLocaleString()}
                      </td>
                      <td className="pp-num">{p.reorder_point}</td>
                      <td>
                        <span className={`pp-status ${p.is_active ? 'pp-active' : 'pp-inactive'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="pp-actions">
                        <button
                          id={`btn-stock-${p.id}`}
                          className="pp-action-btn pp-stock-btn"
                          title="View Stock Levels"
                          onClick={() => setStockProduct(p)}
                        >
                          📊
                        </button>
                        <button
                          id={`btn-edit-${p.id}`}
                          className="pp-action-btn pp-edit-btn"
                          title="Edit Product"
                          onClick={() => setEditProduct(p)}
                        >
                          ✏️
                        </button>
                        {p.is_active === 1 && (
                          <button
                            id={`btn-deactivate-${p.id}`}
                            className="pp-action-btn pp-deactivate-btn"
                            title="Deactivate Product"
                            onClick={() => handleDeactivate(p)}
                          >
                            🚫
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────────────────── */}
        {!loading && meta.totalPages > 1 && (
          <div className="pp-pagination">
            <span className="pp-page-info">
              Page {meta.page} of {meta.totalPages} &mdash; {meta.total} products
            </span>
            <div className="pp-page-btns">
              <button
                id="btn-prev-page"
                className="pp-page-btn"
                disabled={meta.page <= 1}
                onClick={() => loadProducts(meta.page - 1)}
              >
                ← Prev
              </button>
              <button
                id="btn-next-page"
                className="pp-page-btn"
                disabled={meta.page >= meta.totalPages}
                onClick={() => loadProducts(meta.page + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {createOpen && (
        <ProductModal
          mode="create"
          categories={categories}
          uoms={uoms}
          onClose={() => setCreateOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {editProduct && (
        <ProductModal
          mode="edit"
          product={editProduct}
          categories={categories}
          uoms={uoms}
          onClose={() => setEditProduct(null)}
          onSaved={handleSaved}
        />
      )}

      {stockProduct && (
        <ProductStockModal
          product={stockProduct}
          onClose={() => setStockProduct(null)}
        />
      )}
    </main>
  );
}
