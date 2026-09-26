import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient, { setAccessToken } from '../api/client';
import type { Role } from '../types/auth';

export interface AuthUser {
  id: number;
  loginId: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginSuccess: (token: string) => void;
  logoutSuccess: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Note: Since we rely on HttpOnly cookies for refresh, on initial load, we should attempt to hit /refresh
  // to get a new access token if one isn't in memory. For simplicity, we just dispatch the unauthorized event
  // if no token is found and let the protected routes handle redirection.
  
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const loginSuccess = (token: string) => {
    setAccessToken(token);
    try {
      const decoded = jwtDecode<any>(token);
      setUser({
        id: decoded.sub,
        loginId: decoded.loginId,
        role: decoded.role,
      });
    } catch (e) {
      setUser(null);
    }
  };

  const logoutSuccess = () => {
    setAccessToken(null);
    setUser(null);
  };

  useEffect(() => {
    const attemptSilentRefresh = async () => {
      try {
        const { data } = await apiClient.post('/auth/refresh', {}, { withCredentials: true });
        loginSuccess(data.data.accessToken);
      } catch (e) {
        // No valid session, just finish loading
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    attemptSilentRefresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loginSuccess, logoutSuccess, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
