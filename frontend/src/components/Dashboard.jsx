import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/api';
import {
  IconInbox, IconCircle, IconClock, IconCheck,
  IconAlert, IconCalendar, IconHelp, IconDots,
} from './Icons';
import '../styles/dashboard.css';

const CATEGORY = {
  complaint: { label: 'Beschwerde', cls: 'red', Icon: IconAlert },
  booking: { label: 'Buchung', cls: 'green', Icon: IconCalendar },
  inquiry: { label: 'Anfrage', cls: 'blue', Icon: IconHelp },
  other: { label: 'Sonstiges', cls: 'gray', Icon: IconDots },
};
const PRIORITY = {
  high: { label: 'Hoch', cls: 'red' },
  medium: { label: 'Mittel', cls: 'amber' },
  low: { label: 'Niedrig', cls: 'gray' },
};
const STATUS = {
  open: { label: 'Offen', cls: 'blue' },
  in_progress: { label: 'In Bearbeitung', cls: 'amber' },
  closed: { label: 'Geschlossen', cls: 'green' },
};
const SENTIMENT = {
  positive: { label: 'Zufrieden', cls: 'positive' },
  neutral: { label: 'Neutral', cls: 'neutral' },
  negative: { label: 'Unzufrieden', cls: 'negative' },
};

const AVATAR_TINTS = ['a1', 'a2', 'a3', 'a4', 'a5'];
const tintFor = (str = '') =>
  AVATAR_TINTS[[...str].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TINTS.length];

const Dashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTickets();
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
      setTickets((prev) => prev.map((t) => (t._id === ticketId ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${t.guestName} ${t.guestEmail} ${t.subject}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };

  const stats = [
    { key: 'all', label: 'Tickets gesamt', value: counts.all, Icon: IconInbox, tone: 'accent' },
    { key: 'open', label: 'Offen', value: counts.open, Icon: IconCircle, tone: 'blue' },
    { key: 'in_progress', label: 'In Bearbeitung', value: counts.in_progress, Icon: IconClock, tone: 'amber' },
    { key: 'closed', label: 'Geschlossen', value: counts.closed, Icon: IconCheck, tone: 'green' },
  ];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Tickets</h1>
          <p className="page-sub">Gästeanfragen — automatisch kategorisiert, priorisiert und geroutet</p>
        </div>
      </header>

      {/* Stat cards */}
      <div className="stat-grid">
        {stats.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`stat-card ${statusFilter === s.key ? 'stat-card-active' : ''}`}
            onClick={() => setStatusFilter(s.key)}
            aria-pressed={statusFilter === s.key}
            aria-label={`Filter ${s.label}: ${loading ? '–' : s.value} Tickets`}
          >
            <div className="stat-top">
              <span className="stat-label">{s.label}</span>
              <span className={`stat-icon tone-${s.tone}`}><s.Icon size={16} /></span>
            </div>
            <div className="stat-value">{loading ? '–' : s.value}</div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="segmented">
          {[
            ['all', 'Alle'],
            ['open', 'Offen'],
            ['in_progress', 'In Bearbeitung'],
            ['closed', 'Geschlossen'],
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={`seg-btn ${statusFilter === val ? 'seg-btn-active' : ''}`}
              onClick={() => setStatusFilter(val)}
              aria-pressed={statusFilter === val}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="toolbar-right">
          <input
            className="search-input"
            type="search"
            placeholder="Suchen…"
            aria-label="Tickets durchsuchen"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="select" aria-label="Nach Kategorie filtern" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Alle Kategorien</option>
            <option value="complaint">Beschwerde</option>
            <option value="inquiry">Anfrage</option>
            <option value="booking">Buchung</option>
            <option value="other">Sonstiges</option>
          </select>
          <select className="select" aria-label="Nach Priorität filtern" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">Alle Prioritäten</option>
            <option value="high">Hoch</option>
            <option value="medium">Mittel</option>
            <option value="low">Niedrig</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="banner-error">
          Fehler beim Laden: {error}
          <button onClick={loadTickets} className="banner-retry">Erneut versuchen</button>
        </div>
      )}

      {/* Table card */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="tbl">
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
              {loading ? (
                <tr><td colSpan="7" className="tbl-empty"><div className="spinner" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="tbl-empty">
                    <div className="empty-title">Keine Tickets mit diesen Filtern</div>
                    <button
                      type="button"
                      className="empty-action"
                      onClick={() => {
                        setStatusFilter('all');
                        setCategoryFilter('all');
                        setPriorityFilter('all');
                        setSearch('');
                      }}
                    >
                      Filter zurücksetzen
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const cat = CATEGORY[t.category] || CATEGORY.other;
                  const prio = PRIORITY[t.priority] || PRIORITY.medium;
                  const sent = SENTIMENT[t.sentiment] || SENTIMENT.neutral;
                  const CatIcon = cat.Icon;
                  return (
                    <tr
                      key={t._id}
                      className="tbl-row"
                      onClick={() => navigate(`/ticket/${t._id}`)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Ticket öffnen: ${t.guestName} – ${t.subject}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/ticket/${t._id}`);
                        }
                      }}
                    >
                      <td>
                        <div className="guest">
                          <span className={`avatar ${tintFor(t.guestName)}`}>
                            {(t.guestName || '?').charAt(0).toUpperCase()}
                          </span>
                          <div className="guest-text">
                            <div className="guest-name">{t.guestName}</div>
                            <div className="guest-mail">{t.guestEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="subject-cell">
                        <div className="subject">{t.subject}</div>
                        <div className="snippet">{(t.body || '').slice(0, 60)}{(t.body || '').length > 60 ? '…' : ''}</div>
                      </td>
                      <td>
                        <span className={`pill tint-${cat.cls}`}><CatIcon size={13} />{cat.label}</span>
                      </td>
                      <td>
                        <span className={`pill tint-${prio.cls}`}>{prio.label}</span>
                      </td>
                      <td>
                        <span className="sentiment">
                          <span className={`dot dot-${sent.cls}`} />{sent.label}
                        </span>
                      </td>
                      <td><span className="team">{t.assignedTo || '—'}</span></td>
                      <td onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        <div className={`status-select-wrap tint-${STATUS[t.status]?.cls || 'gray'}`}>
                          <select
                            className="status-select"
                            aria-label={`Status ändern für Ticket von ${t.guestName}`}
                            value={t.status}
                            onChange={(e) => handleStatusChange(t._id, e.target.value, e)}
                          >
                            <option value="open">Offen</option>
                            <option value="in_progress">In Bearbeitung</option>
                            <option value="closed">Geschlossen</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
