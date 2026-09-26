import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardKpis, type KpiPayload } from '../api/dashboard';
import './DashboardPage.css';

// ── KPI card configuration ───────────────────────────────────────────────────
interface KpiCardConfig {
  key: keyof KpiPayload;
  label: string;
  color: string;
  description: string;
  link?: string;
}

const KPI_CARDS: KpiCardConfig[] = [
  { key: 'totalProducts',      label: 'Total Products',      color: 'blue',   description: 'Active products in catalog',          link: '/products'   },
  { key: 'lowStockItems',      label: 'Low Stock',           color: 'amber',  description: 'Below reorder point, still in stock', link: '/products'   },
  { key: 'outOfStockItems',    label: 'Out of Stock',        color: 'red',    description: 'Zero units across all locations',     link: '/products'   },
  { key: 'pendingReceipts',    label: 'Pending Receipts',    color: 'teal',   description: 'Draft or ready to receive',           link: '/receipts'   },
  { key: 'pendingDeliveries',  label: 'Pending Deliveries',  color: 'purple', description: 'Draft, waiting, or ready to ship',      link: '/deliveries' },
  { key: 'scheduledTransfers', label: 'Scheduled Transfers', color: 'indigo', description: 'Internal movements in progress',      link: '/transfers'  },
  { key: 'waitingOperations',  label: 'Waiting for Stock',   color: 'orange', description: 'Deliveries blocked on stock',           link: '/deliveries' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ config, value }: { config: KpiCardConfig; value: number }) {
  const isAlert =
    (config.key === 'lowStockItems' ||
      config.key === 'outOfStockItems' ||
      config.key === 'waitingOperations') &&
    value > 0;

  const content = (
    <>
      <div className="kpi-card__marker" aria-hidden="true" />
      <div className="kpi-card__body">
        <span className="kpi-card__value">{value.toLocaleString()}</span>
        <span className="kpi-card__label">{config.label}</span>
        <span className="kpi-card__desc">{config.description}</span>
      </div>
    </>
  );

  return config.link ? (
    <Link to={config.link} className={`kpi-card kpi-card--${config.color}${isAlert ? ' kpi-card--alert' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      {content}
    </Link>
  ) : (
    <div className={`kpi-card kpi-card--${config.color}${isAlert ? ' kpi-card--alert' : ''}`}>
      {content}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="kpi-card kpi-card--skeleton" aria-hidden="true">
      <div className="skeleton skeleton--icon" />
      <div className="kpi-card__body">
        <div className="skeleton skeleton--value" />
        <div className="skeleton skeleton--label" />
        <div className="skeleton skeleton--desc" />
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="dashboard-error" role="alert">
      <span className="dashboard-error__icon" aria-hidden="true" />
      <div>
        <strong>Could not load dashboard data</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const { data, isLoading, isError, error, refetch } = useQuery<KpiPayload>({
    queryKey: ['dashboard', 'kpis'],
    queryFn: fetchDashboardKpis,
    staleTime: 60_000,
    retry: 2,
  });

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <header className="dashboard__header">
        <div className="dashboard__header-text">
          <h1 className="dashboard__title">
                 Operational Dashboard
          </h1>
          <p className="dashboard__subtitle">
            {greeting}{user?.loginId ? `, ${user.loginId}` : ''} — here's your inventory at a glance.
            {user?.role && (
              <span className="dashboard__role-badge">{user.role.replace('_', ' ')}</span>
            )}
          </p>
        </div>
        <div className="dashboard__header-actions">
          <span className="dashboard__timestamp">
            {now.toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <button
            className="dashboard__refresh-btn"
            onClick={() => refetch()}
            disabled={isLoading}
            aria-label="Refresh dashboard data"
          >
            {isLoading ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* ── Error banner ── */}
      {isError && (
        <ErrorBanner
          message={error instanceof Error ? error.message : 'An unexpected error occurred.'}
        />
      )}

      {/* ── KPI Grid ── */}
      <section className="dashboard__section" aria-label="Key performance indicators">
        <h2 className="dashboard__section-title">Inventory Health</h2>
        <div className="kpi-grid" role="list">
          {isLoading
            ? KPI_CARDS.map((c) => <SkeletonCard key={c.key} />)
            : KPI_CARDS.map((c) => (
                <div key={c.key} role="listitem">
                  <KpiCard config={c} value={data?.[c.key] ?? 0} />
                </div>
              ))}
        </div>
      </section>

      {/* ── Operational Summary ── */}
      {!isLoading && data && (
        <section className="dashboard__section" aria-label="Operational summary">
          <h2 className="dashboard__section-title">Operational Summary</h2>
          <div className="summary-grid">
            <Link to="/receipts" className="summary-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="summary-card__body">
                <span className="summary-card__stat">{data.pendingReceipts}</span>
                <span className="summary-card__label">Receipts to Process</span>
              </div>
            </Link>
            <Link to="/deliveries" className="summary-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="summary-card__body">
                <span className="summary-card__stat">{data.pendingDeliveries}</span>
                <span className="summary-card__label">Deliveries to Dispatch</span>
              </div>
            </Link>
            <Link to="/deliveries" className="summary-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="summary-card__body">
                <span
                  className={`summary-card__stat${data.waitingOperations > 0 ? ' summary-card__stat--alert' : ''}`}
                >
                  {data.waitingOperations}
                </span>
                <span className="summary-card__label">Waiting for Stock</span>
              </div>
            </Link>
            <Link to="/transfers" className="summary-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="summary-card__body">
                <span className="summary-card__stat">{data.scheduledTransfers}</span>
                <span className="summary-card__label">Transfers Scheduled</span>
              </div>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};
