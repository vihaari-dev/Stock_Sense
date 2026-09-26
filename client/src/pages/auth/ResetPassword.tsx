import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../../api/auth';
import './Auth.css';

export const ResetPassword: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    new_password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(formData);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to reset password.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter your OTP and a new password</p>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
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
            <label className="form-label" htmlFor="otp">6-Digit OTP</label>
            <input 
              className="form-input"
              id="otp" 
              type="text" 
              value={formData.otp}
              onChange={handleChange}
              minLength={6}
              maxLength={6}
              required
              style={{ letterSpacing: '0.25em', textAlign: 'center' }}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="new_password">New Password</label>
            <input 
              className="form-input"
              id="new_password" 
              type="password" 
              value={formData.new_password}
              onChange={handleChange}
              minLength={8}
              required
            />
          </div>
          
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        <div className="auth-link-container" style={{ justifyContent: 'center' }}>
          <Link to="/login" className="auth-link">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};
