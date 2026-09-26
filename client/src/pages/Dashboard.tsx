import React from 'react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../api/auth';

export const Dashboard: React.FC = () => {
  const { user, logoutSuccess } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      logoutSuccess();
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.loginId}!</p>
      <p>Your role: <strong>{user?.role}</strong></p>
      
      <button 
        onClick={handleLogout}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  );
};
