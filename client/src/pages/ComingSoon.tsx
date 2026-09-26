import React from 'react';
import { useLocation } from 'react-router-dom';

export const ComingSoon: React.FC = () => {
  const location = useLocation();
  const pathName = location.pathname.split('/')[1] || 'Feature';
  const featureName = pathName.charAt(0).toUpperCase() + pathName.slice(1);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: 'calc(100vh - 80px)',
      color: '#94a3b8',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚧</div>
      <h1 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>{featureName} Coming Soon</h1>
      <p style={{ maxWidth: '400px', lineHeight: '1.5' }}>
        This module is currently under construction. Check back soon for updates as we continue building Stock Sense!
      </p>
    </div>
  );
};
