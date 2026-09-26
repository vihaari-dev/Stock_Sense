import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';

// App Pages
import { Dashboard } from './pages/Dashboard';
import { CategoriesPage } from './pages/CategoriesPage';
import { ReceiptsPage } from './pages/ReceiptsPage';
import WarehouseList from './pages/warehouses/WarehouseList';
import WarehouseForm from './pages/warehouses/WarehouseForm';
import { ComingSoon } from './pages/ComingSoon';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/receipts" element={<ReceiptsPage />} />
              
              {/* Warehouse Routes */}
              <Route path="/warehouses" element={<WarehouseList />} />
              <Route path="/warehouses/new" element={<WarehouseForm />} />
              <Route path="/warehouses/:id/edit" element={<WarehouseForm />} />
              
              {/* Unbuilt Features / Placeholders */}
              <Route path="/products" element={<ComingSoon />} />
              <Route path="/deliveries" element={<ComingSoon />} />
              <Route path="/transfers" element={<ComingSoon />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

