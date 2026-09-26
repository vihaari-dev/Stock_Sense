import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from './pages/DashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
    },
  },
});

/**
 * Temporary auth guard — checks for an access token in sessionStorage.
 * Will be replaced by the proper AuthContext once the Authentication feature is built.
 * Satisfies AC-6 of spec 0002.
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const hasToken = Boolean(sessionStorage.getItem('accessToken'));
  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/**
 * Temporary login placeholder — the real login page is built in the Auth feature.
 * Allows developers to set a token manually for dashboard testing.
 */
function LoginPlaceholder() {
  function handleDemo() {
    // Allow manual token injection during development.
    // In production this token comes from the real login API response.
    const token = prompt('Paste your access token (from POST /api/v1/auth/login response):');
    if (token) {
      sessionStorage.setItem('accessToken', token);
      window.location.href = '/dashboard';
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0f14',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#e8eaf0',
      gap: '1.5rem',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          📦 StockSense
        </h1>
        <p style={{ color: '#7a7f96', fontSize: '0.9rem' }}>
          Inventory Management System
        </p>
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '380px',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Login</h2>
        <p style={{ color: '#7a7f96', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
          Login UI is built in the Authentication feature.<br />
          For now, paste your access token to test the dashboard.
        </p>
        <button
          id="dev-login-btn"
          onClick={handleDemo}
          style={{
            background: 'rgba(99,102,241,0.2)',
            border: '1px solid rgba(99,102,241,0.4)',
            color: '#c7d2fe',
            borderRadius: '10px',
            padding: '0.65rem 1.5rem',
            fontSize: '0.88rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Enter Access Token (Dev Mode)
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPlaceholder />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          {/* Default redirect: root goes to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
