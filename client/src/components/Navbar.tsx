import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../api/auth';
import './Navbar.css';

export const Navbar: React.FC = () => {
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
    <nav className="global-navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">📦</span>
        <span className="navbar-title">Stock Sense</span>
      </div>
      
      <div className="navbar-links">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          📊 Dashboard
        </NavLink>
        <NavLink 
          to="/categories" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          🏷️ Categories
        </NavLink>
        <NavLink 
          to="/warehouses" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          🏢 Warehouses
        </NavLink>
        <NavLink 
          to="/receipts" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          📥 Receipts
        </NavLink>
      </div>

      <div className="navbar-user">
        <span className="user-info">
          {user?.loginId} <span className="user-role">({user?.role.replace('_', ' ')})</span>
        </span>
        <button className="nav-logout-btn" onClick={handleLogout} aria-label="Logout">
          ⏻
        </button>
      </div>
    </nav>
  );
};
