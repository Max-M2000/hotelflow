import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

const DEMO_EMAIL = 'admin@hotelflow.com';
const DEMO_PASSWORD = 'demo123';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      onLogin(email);
      navigate('/');
    } else {
      setError('Falsche Zugangsdaten. Nutze die unten angezeigten Demo-Daten.');
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  };

  return (
    <div className="authContainer">
      <div className="authCard">
        <div className="authHeader">
          <h1>🏨 HotelFlow</h1>
          <p>E-Mail → Ticket Automatisierung</p>
        </div>

        <form onSubmit={handleSubmit} className="authForm">
          <div className="formGroup">
            <label htmlFor="email">E-Mail</label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hotelflow.com"
              className="authInput"
            />
          </div>

          <div className="formGroup">
            <label htmlFor="password">Passwort</label>
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
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>

        <div className="demoBox">
          <div className="demoBoxTitle">Demo-Zugang</div>
          <div className="demoBoxRow">admin@hotelflow.com / demo123</div>
          <button type="button" onClick={fillDemo} className="demoFillButton">
            Demo-Daten einsetzen
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
