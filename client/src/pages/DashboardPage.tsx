import { useQuery } from '@tanstack/react-query';
import { fetchDashboardKpis, type KpiPayload } from '../api/dashboard';
import './DashboardPage.css';

// ── KPI card configuration ───────────────────────────────────────────────────
interface KpiCardConfig {
  key: keyof KpiPayload;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const KPI_CARDS: KpiCardConfig[] = [
  { key: 'totalProducts',      label: 'Total Products',         icon: '📦', color: 'blue',   description: 'Active products in catalog'       },
  { key: 'lowStockItems',      label: 'Low Stock',              icon: '⚠️', color: 'amber',  description: 'Below reorder point, still in stock' },
  { key: 'outOfStockItems',    label: 'Out of Stock',           icon: '🚨', color: 'red',    description: 'Zero units across all locations'  },
  { key: 'pendingReceipts',    label: 'Pending Receipts',       icon: '📥', color: 'teal',   description: 'Draft or ready to receive'        },
  { key: 'pendingDeliveries',  label: 'Pending Deliveries',     icon: '📤', color: 'purple', description: 'Draft, waiting, or ready to ship' },
  { key: 'scheduledTransfers', label: 'Scheduled Transfers',    icon: '🔄', color: 'indigo', description: 'Internal movements in progress'   },
  { key: 'waitingOperations',  label: 'Waiting for Stock',      icon: '⏳', color: 'orange', description: 'Deliveries blocked on stock'      },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ config, value }: { config: KpiCardConfig; value: number }) {
  const isAlert = (config.key === 'lowStockItems' || config.key === 'outOfStockItems' || config.key === 'waitingOperations') && value > 0;

  return (
    <div className={`kpi-card kpi-card--${config.color}${isAlert ? ' kpi-card--alert' : ''}`}>
      <div className="kpi-card__icon" aria-hidden="true">{config.icon}</div>
      <div className="kpi-card__body">
        <span className="kpi-card__value">{value.toLocaleString()}</span>
        <span className="kpi-card__label">{config.label}</span>
        <span className="kpi-card__desc">{config.description}</span>
      </div>
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
      <span className="dashboard-error__icon">⚠️</span>
      <div>
        <strong>Could not load dashboard data</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const { data, isLoading, isError, error, refetch } = useQuery<KpiPayload>({
    queryKey: ['dashboard', 'kpis'],
    queryFn: fetchDashboardKpis,
    staleTime: 60_000, // 60 seconds
    retry: 2,
  });

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <header className="dashboard__header">
        <div className="dashboard__header-text">
          <h1 className="dashboard__title">
            <span className="dashboard__title-wave">📊</span> Operational Dashboard
          </h1>
          <p className="dashboard__subtitle">{greeting} — here's your inventory at a glance.</p>
        </div>
        <div className="dashboard__header-actions">
          <span className="dashboard__timestamp">
            {now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <button
            className="dashboard__refresh-btn"
            onClick={() => refetch()}
            disabled={isLoading}
            aria-label="Refresh dashboard data"
          >
            {isLoading ? '⟳' : '↻'} Refresh
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
              ))
          }
        </div>
      </section>

      {/* ── Operational Summary ── */}
      {!isLoading && data && (
        <section className="dashboard__section" aria-label="Operational summary">
          <h2 className="dashboard__section-title">Operational Summary</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-card__icon">📥</span>
              <div className="summary-card__body">
                <span className="summary-card__stat">{data.pendingReceipts}</span>
                <span className="summary-card__label">Receipts to Process</span>
              </div>
            </div>
            <div className="summary-card">
              <span className="summary-card__icon">📤</span>
              <div className="summary-card__body">
                <span className="summary-card__stat">{data.pendingDeliveries}</span>
                <span className="summary-card__label">Deliveries to Dispatch</span>
              </div>
            </div>
            <div className="summary-card">
              <span className="summary-card__icon">⏳</span>
              <div className="summary-card__body">
                <span className={`summary-card__stat${data.waitingOperations > 0 ? ' summary-card__stat--alert' : ''}`}>
                  {data.waitingOperations}
                </span>
                <span className="summary-card__label">Waiting for Stock</span>
              </div>
            </div>
            <div className="summary-card">
              <span className="summary-card__icon">🔄</span>
              <div className="summary-card__body">
                <span className="summary-card__stat">{data.scheduledTransfers}</span>
                <span className="summary-card__label">Transfers Scheduled</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
