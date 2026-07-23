import React, { useState, useEffect } from 'react';
import { ticketAPI } from '../services/api';
import { getStatusColor, getPriorityColor, getCategoryColor, LIGHT_MODE, DARK_MODE } from '../theme/palette';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isDark, setIsDark] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        const data = await ticketAPI.getTickets();
        setTickets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();

    // Listen for dark mode changes
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleDarkModeChange = (e) => setIsDark(e.matches);
    darkModeQuery.addEventListener('change', handleDarkModeChange);
    return () => darkModeQuery.removeEventListener('change', handleDarkModeChange);
  }, []);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const updated = await ticketAPI.updateTicket(ticketId, { status: newStatus });
      setTickets(tickets.map(t => t._id === ticketId ? updated : t));
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter tickets
  const filteredTickets = filter === 'all'
    ? tickets
    : tickets.filter(t => t.status === filter);

  if (loading) {
    return (
      <div className="container">
        <div className="loadingState">
          <div className="spinner"></div>
          <p>Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="errorState">
          <p>❌ Error: {error}</p>
        </div>
      </div>
    );
  }

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div>
          <h1>🏨 HotelFlow Dashboard</h1>
          <p className="subtitle">Intelligent Guest Communication Management</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="statTile">
          <div className="statNumber">{statusCounts.all}</div>
          <div className="statLabel">Total Tickets</div>
        </div>
        <div className="statTile" style={{ borderTopColor: getStatusColor('open', isDark) }}>
          <div className="statNumber">{statusCounts.open}</div>
          <div className="statLabel">Open</div>
        </div>
        <div className="statTile" style={{ borderTopColor: getStatusColor('in_progress', isDark) }}>
          <div className="statNumber">{statusCounts.in_progress}</div>
          <div className="statLabel">In Progress</div>
        </div>
        <div className="statTile" style={{ borderTopColor: getStatusColor('closed', isDark) }}>
          <div className="statNumber">{statusCounts.closed}</div>
          <div className="statLabel">Closed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filterBar">
        <label htmlFor="status-filter">Filter by Status:</label>
        <select
          id="status-filter"
          className="filterSelect"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Tickets ({statusCounts.all})</option>
          <option value="open">Open ({statusCounts.open})</option>
          <option value="in_progress">In Progress ({statusCounts.in_progress})</option>
          <option value="closed">Closed ({statusCounts.closed})</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="tableWrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan="6" className="emptyState">
                  No tickets in this status
                </td>
              </tr>
            ) : (
              filteredTickets.map(ticket => (
                <tr key={ticket._id} className="ticketRow">
                  <td>
                    <div className="guestCell">
                      <div className="guestName">{ticket.guestName}</div>
                      <div className="guestEmail">{ticket.guestEmail}</div>
                    </div>
                  </td>
                  <td>
                    <div className="subjectCell">{ticket.subject}</div>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: getCategoryColor(ticket.category, isDark),
                        color: isDark ? '#1e1e1e' : '#ffffff'
                      }}
                    >
                      {ticket.category}
                    </span>
                  </td>
                  <td>
                    <span
                      className="priorityBadge"
                      style={{
                        backgroundColor: getPriorityColor(ticket.priority, isDark),
                        color: isDark ? '#1e1e1e' : '#ffffff'
                      }}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td>
                    <select
                      className="statusSelect"
                      style={{
                        borderLeftColor: getStatusColor(ticket.status, isDark),
                        color: getStatusColor(ticket.status, isDark),
                      }}
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                    >
                      <option value="open">● Open</option>
                      <option value="in_progress">⟳ In Progress</option>
                      <option value="closed">✓ Closed</option>
                    </select>
                  </td>
                  <td>
                    <a href={`/ticket/${ticket._id}`} className="viewLink">
                      View →
                    </a>
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
