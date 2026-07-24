import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconLogo, IconInbox, IconAlert, IconCheck } from '../components/Icons';
import '../styles/auth.css';

const DEMO_EMAIL = 'admin@ospitara.com';
const DEMO_PASSWORD = 'demo123';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError('Falsche Zugangsdaten. Nutze die Demo-Daten unten.');
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  };

  return (
    <div className="auth">
      {/* Brand panel */}
      <div className="auth-brand">
        <div className="auth-brand-top">
          <div className="auth-logo">
            <IconLogo size={30} />
            <span>Ospitara</span>
          </div>
        </div>
        <div className="auth-brand-mid">
          <h2>Gäste-E-Mails,<br />automatisch sortiert.</h2>
          <p>Jede eingehende Nachricht wird per KI kategorisiert, priorisiert und an das richtige Team geroutet — bevor dein Team überhaupt draufschaut.</p>
          <ul className="auth-features">
            <li><span className="af-icon"><IconInbox size={15} /></span> Automatische Ticket-Erstellung aus E-Mails</li>
            <li><span className="af-icon"><IconAlert size={15} /></span> KI erkennt Beschwerden & Priorität</li>
            <li><span className="af-icon"><IconCheck size={15} /></span> Klares Routing statt Chaos im Postfach</li>
          </ul>
        </div>
        <div className="auth-brand-bottom">Für kleine & mittlere Hotels · DACH</div>
      </div>

      {/* Form panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-card-head">
            <h1>Willkommen zurück</h1>
            <p>Melde dich in deinem Ospitara-Dashboard an</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">E-Mail</label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ospitara.com"
                autoComplete="username"
                autoFocus
              />
            </div>
            <div className="auth-field">
              <label htmlFor="password">Passwort</label>
              <div className="password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showPassword ? 'Verbergen' : 'Anzeigen'}
                </button>
              </div>
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? 'Anmelden…' : 'Anmelden'}
            </button>
          </form>

          <div className="auth-demo">
            <div className="auth-demo-label">Demo-Zugang</div>
            <code>admin@ospitara.com · demo123</code>
            <button type="button" onClick={fillDemo} className="auth-demo-btn">Einsetzen</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
