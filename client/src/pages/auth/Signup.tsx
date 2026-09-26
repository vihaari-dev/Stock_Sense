import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../../api/auth';
import './Auth.css';

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    login_id: '',
    email: '',
    password: '',
    full_name: '',
    role: 'inventory_manager'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(formData);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create account.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join StockSense to manage your inventory</p>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="full_name">Full Name</label>
            <input 
              className="form-input"
              id="full_name" 
              type="text" 
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input 
              className="form-input"
              id="email" 
              type="email" 
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login_id">Login ID</label>
            <input 
              className="form-input"
              id="login_id" 
              type="text" 
              value={formData.login_id}
              onChange={handleChange}
              minLength={6}
              maxLength={12}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              className="form-input"
              id="password" 
              type="password" 
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role">Role</label>
            <select 
              className="form-select"
              id="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="inventory_manager">Inventory Manager</option>
              <option value="warehouse_staff">Warehouse Staff</option>
            </select>
          </div>
          
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="auth-link-container" style={{ justifyContent: 'center' }}>
          <span style={{ color: '#94a3b8', marginRight: '0.5rem' }}>Already have an account?</span>
          <Link to="/login" className="auth-link">Login</Link>
        </div>
      </div>
    </div>
  );
};
