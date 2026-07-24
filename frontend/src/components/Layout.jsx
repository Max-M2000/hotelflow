import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconLogo, IconInbox, IconChart, IconSettings, IconLogout, IconUsers } from './Icons';
import '../styles/layout.css';

const Layout = ({ children, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = localStorage.getItem('hotelflow_user') || 'admin@ospitara.com';
  const initials = userEmail.charAt(0).toUpperCase();

  const isTickets = location.pathname === '/' || location.pathname.startsWith('/ticket');

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <button
          type="button"
          className="sidebar-brand"
          onClick={() => navigate('/')}
          aria-label="Ospitara – zur Übersicht"
        >
          <IconLogo />
          <span className="brand-name">Ospitara</span>
        </button>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Arbeitsbereich</div>
          <button
            className={`nav-item ${isTickets ? 'nav-item-active' : ''}`}
            onClick={() => navigate('/')}
            aria-current={isTickets ? 'page' : undefined}
          >
            <IconInbox size={18} />
            <span>Tickets</span>
          </button>
          <button className="nav-item nav-item-disabled" disabled>
            <IconUsers size={18} />
            <span>Team-Routing</span>
            <span className="nav-badge">Bald</span>
          </button>
          <button className="nav-item nav-item-disabled" disabled>
            <IconChart size={18} />
            <span>Berichte</span>
            <span className="nav-badge">Bald</span>
          </button>
          <button className="nav-item nav-item-disabled" disabled>
            <IconSettings size={18} />
            <span>Einstellungen</span>
            <span className="nav-badge">Bald</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">Admin</div>
              <div className="user-email">{userEmail}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Abmelden" aria-label="Abmelden">
              <IconLogout size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
};

export default Layout;
