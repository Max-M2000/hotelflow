import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconLogo } from '../components/Icons';
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
          <h2 className="auth-hero">
            Der Posteingang,<br />der sich <span className="auth-hero-hl">selbst sortiert</span>.
          </h2>
          <p>Jede Gästemail wird per KI kategorisiert, priorisiert und ans richtige Team geroutet — bevor jemand draufschaut.</p>

          <div className="route-preview" aria-hidden="true">
            <div className="rp-eyebrow">Automatisches Routing</div>
            <div className="rp-row" style={{ animationDelay: '0.15s' }}>
              <span className="rp-avatar rp-av-red">M</span>
              <span className="rp-msg">„Klimaanlage in Zimmer 210 defekt“</span>
              <span className="rp-pill rp-red">Beschwerde</span>
              <span className="rp-arrow">→</span>
              <span className="rp-team">Management</span>
            </div>
            <div className="rp-row" style={{ animationDelay: '0.3s' }}>
              <span className="rp-avatar rp-av-green">L</span>
              <span className="rp-msg">„Ist im Juli ein Zimmer frei?“</span>
              <span className="rp-pill rp-green">Buchung</span>
              <span className="rp-arrow">→</span>
              <span className="rp-team">Reservierung</span>
            </div>
            <div className="rp-row" style={{ animationDelay: '0.45s' }}>
              <span className="rp-avatar rp-av-blue">S</span>
              <span className="rp-msg">„Können wir früher einchecken?“</span>
              <span className="rp-pill rp-blue">Anfrage</span>
              <span className="rp-arrow">→</span>
              <span className="rp-team">Rezeption</span>
            </div>
          </div>
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
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ospitara.com"
                autoComplete="username"
                spellCheck={false}
                autoCapitalize="none"
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
