import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple validation
    if (!email || !password) {
      setError('Email and password required');
      setLoading(false);
      return;
    }

    // Simulate login (in real app, would call backend)
    setTimeout(() => {
      onLogin(email, password);
      navigate('/');
      setLoading(false);
    }, 500);
  };

  return (
    <div className="authContainer">
      <div className="authCard">
        <div className="authHeader">
          <h1>🏨 HotelFlow</h1>
          <p>Guest Communication Management</p>
        </div>

        <form onSubmit={handleSubmit} className="authForm">
          <div className="formGroup">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="authInput"
            />
          </div>

          <div className="formGroup">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="authInput"
            />
          </div>

          {error && <div className="authError">{error}</div>}

          <button type="submit" disabled={loading} className="authButton">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="authFooter">
          <p>Demo? <a href="/demo" className="authLink">Try Demo Mode</a></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
