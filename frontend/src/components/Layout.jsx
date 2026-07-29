import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconLogo, IconInbox, IconChart, IconSettings, IconLogout, IconUsers, IconShield } from './Icons';
import '../styles/layout.css';

const Layout = ({ children, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = localStorage.getItem('hotelflow_user') || 'admin@ospitara.com';
  const userName = localStorage.getItem('hotelflow_name') || 'Admin';
  const isAdmin = localStorage.getItem('hotelflow_role') === 'admin';
  const initials = (userName || userEmail).charAt(0).toUpperCase();

  const isTickets = location.pathname === '/' || location.pathname.startsWith('/ticket');
  const isRouting = location.pathname.startsWith('/routing');
  const isReports = location.pathname.startsWith('/reports');
  const isSettings = location.pathname.startsWith('/settings');
  const isUsers = location.pathname.startsWith('/users');

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
          <span className="brand-name" translate="no">Ospitara</span>
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
          <button
            className={`nav-item ${isRouting ? 'nav-item-active' : ''}`}
            onClick={() => navigate('/routing')}
            aria-current={isRouting ? 'page' : undefined}
          >
            <IconUsers size={18} />
            <span>Team-Routing</span>
          </button>
          <button
            className={`nav-item ${isReports ? 'nav-item-active' : ''}`}
            onClick={() => navigate('/reports')}
            aria-current={isReports ? 'page' : undefined}
          >
            <IconChart size={18} />
            <span>Berichte</span>
          </button>
          <button
            className={`nav-item ${isSettings ? 'nav-item-active' : ''}`}
            onClick={() => navigate('/settings')}
            aria-current={isSettings ? 'page' : undefined}
          >
            <IconSettings size={18} />
            <span>Einstellungen</span>
          </button>

          {isAdmin && (
            <>
              <div className="nav-section-label nav-section-label-admin">Administration</div>
              <button
                className={`nav-item ${isUsers ? 'nav-item-active' : ''}`}
                onClick={() => navigate('/users')}
                aria-current={isUsers ? 'page' : undefined}
              >
                <IconShield size={18} />
                <span>Team verwalten</span>
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{userName}{isAdmin && <span className="user-role-tag">Admin</span>}</div>
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
