import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/api';
import {
  getStatusColor,
  getPriorityColor,
  getCategoryColor,
  getSentimentColor,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  SENTIMENT_LABELS,
} from '../theme/palette';
import '../styles/dashboard.css';

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isDark, setIsDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    loadTickets();

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleDarkModeChange = (e) => setIsDark(e.matches);
    darkModeQuery.addEventListener('change', handleDarkModeChange);
    return () => darkModeQuery.removeEventListener('change', handleDarkModeChange);
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketAPI.getTickets();
      setTickets(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus, e) => {
    e.stopPropagation();
    try {
      const updated = await ticketAPI.updateTicket(ticketId, { status: newStatus });
      setTickets(tickets.map((t) => (t._id === ticketId ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  // Apply all filters
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loadingState">
          <div className="spinner"></div>
          <p>Tickets werden geladen…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div>
          <h1>🏨 HotelFlow</h1>
          <p className="subtitle">Gästeanfragen automatisch als Tickets — kategorisiert, priorisiert, geroutet</p>
        </div>
        <button onClick={handleLogout} className="logoutButton">
          Abmelden
        </button>
      </div>

      {error && (
        <div className="errorState" style={{ marginBottom: 24 }}>
          ⚠️ Fehler: {error}
          <button onClick={loadTickets} className="retryButton">Erneut versuchen</button>
        </div>
      )}

      {/* Stats */}
      <div className="stats">
        <div className="statTile">
          <div className="statNumber">{statusCounts.all}</div>
          <div className="statLabel">Tickets gesamt</div>
        </div>
        <div className="statTile" style={{ borderTopColor: getStatusColor('open', isDark) }}>
          <div className="statNumber">{statusCounts.open}</div>
          <div className="statLabel">Offen</div>
        </div>
        <div className="statTile" style={{ borderTopColor: getStatusColor('in_progress', isDark) }}>
          <div className="statNumber">{statusCounts.in_progress}</div>
          <div className="statLabel">In Bearbeitung</div>
        </div>
        <div className="statTile" style={{ borderTopColor: getStatusColor('closed', isDark) }}>
          <div className="statNumber">{statusCounts.closed}</div>
          <div className="statLabel">Geschlossen</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filterBar">
        <div className="filterGroup">
          <label>Status</label>
          <select className="filterSelect" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Alle</option>
            <option value="open">Offen</option>
            <option value="in_progress">In Bearbeitung</option>
            <option value="closed">Geschlossen</option>
          </select>
        </div>
        <div className="filterGroup">
          <label>Kategorie</label>
          <select className="filterSelect" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Alle</option>
            <option value="complaint">Beschwerde</option>
            <option value="inquiry">Anfrage</option>
            <option value="booking">Buchung</option>
            <option value="other">Sonstiges</option>
          </select>
        </div>
        <div className="filterGroup">
          <label>Priorität</label>
          <select className="filterSelect" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">Alle</option>
            <option value="high">Hoch</option>
            <option value="medium">Mittel</option>
            <option value="low">Niedrig</option>
          </select>
        </div>
        <div className="filterResult">{filteredTickets.length} angezeigt</div>
      </div>

      {/* Tickets Table */}
      <div className="tableWrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Gast</th>
              <th>Betreff</th>
              <th>Kategorie</th>
              <th>Priorität</th>
              <th>Stimmung</th>
              <th>Team</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan="7" className="emptyState">
                  Keine Tickets mit diesen Filtern
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => (
                <tr key={ticket._id} className="ticketRow" onClick={() => navigate(`/ticket/${ticket._id}`)}>
                  <td>
                    <div className="guestCell">
                      <div className="guestName">{ticket.guestName}</div>
                      <div className="guestEmail">{ticket.guestEmail}</div>
                    </div>
                  </td>
                  <td><div className="subjectCell">{ticket.subject}</div></td>
                  <td>
                    <span className="badge" style={{ backgroundColor: getCategoryColor(ticket.category, isDark) }}>
                      {CATEGORY_LABELS[ticket.category] || ticket.category}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: getPriorityColor(ticket.priority, isDark) }}>
                      {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                    </span>
                  </td>
                  <td>
                    <span className="sentimentDot" style={{ color: getSentimentColor(ticket.sentiment, isDark) }}>
                      ● {SENTIMENT_LABELS[ticket.sentiment] || '—'}
                    </span>
                  </td>
                  <td><span className="teamCell">{ticket.assignedTo || '—'}</span></td>
                  <td>
                    <select
                      className="statusSelect"
                      style={{ borderLeftColor: getStatusColor(ticket.status, isDark), color: getStatusColor(ticket.status, isDark) }}
                      value={ticket.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(ticket._id, e.target.value, e)}
                    >
                      <option value="open">● Offen</option>
                      <option value="in_progress">⟳ In Bearbeitung</option>
                      <option value="closed">✓ Geschlossen</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
