import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/api';
import {
  IconInbox, IconCircle, IconClock, IconCheck, IconRefresh,
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
const PRANK = { high: 0, medium: 1, low: 2 };
const OVERDUE_HRS = 24;

const AVATAR_TINTS = ['a1', 'a2', 'a3', 'a4', 'a5'];
const tintFor = (str = '') =>
  AVATAR_TINTS[[...str].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TINTS.length];

// ----- Ticket state helpers (as a hotel thinks about them) -----
const hasReply = (t) => Array.isArray(t.replies) && t.replies.length > 0;
const isWaiting = (t) => t.status !== 'closed' && !hasReply(t);
const ageMs = (t) => Date.now() - new Date(t.createdAt).getTime();
const isOverdue = (t) => isWaiting(t) && ageMs(t) > OVERDUE_HRS * 3600 * 1000;

const relativeTime = (d) => {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs} Std`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `vor ${weeks} Wo`;
  return `vor ${Math.floor(days / 30)} Mon`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [attention, setAttention] = useState('all'); // all | waiting | overdue
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async (isManual) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      const data = await ticketAPI.getTickets();
      setTickets(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const toggleAttention = (val) => setAttention((cur) => (cur === val ? 'all' : val));

  // ----- Bulk selection -----
  const toggleOne = (id, e) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const bulkUpdateStatus = async (newStatus) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBulkBusy(true);
    setError(null);
    try {
      const results = await Promise.all(
        ids.map((id) => ticketAPI.updateTicket(id, { status: newStatus }))
      );
      const byId = new Map(results.map((r) => [r._id, r]));
      setTickets((prev) => prev.map((t) => byId.get(t._id) || t));
      setSelected(new Set());
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setBulkBusy(false);
    }
  };

  const filtered = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (attention === 'waiting' && !isWaiting(t)) return false;
    if (attention === 'overdue' && !isOverdue(t)) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${t.guestName} ${t.guestEmail} ${t.subject}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const rows = [...filtered].sort((x, y) => {
    if (sortBy === 'oldest') return new Date(x.createdAt) - new Date(y.createdAt);
    if (sortBy === 'priority')
      return (PRANK[x.priority] ?? 1) - (PRANK[y.priority] ?? 1) || new Date(y.createdAt) - new Date(x.createdAt);
    if (sortBy === 'waiting')
      return (isWaiting(y) - isWaiting(x)) || new Date(x.createdAt) - new Date(y.createdAt);
    return new Date(y.createdAt) - new Date(x.createdAt); // newest
  });

  const allVisibleSelected = rows.length > 0 && rows.every((t) => selected.has(t._id));
  const someVisibleSelected = rows.some((t) => selected.has(t._id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (rows.length > 0 && rows.every((t) => next.has(t._id))) {
        rows.forEach((t) => next.delete(t._id)); // all selected → clear visible
      } else {
        rows.forEach((t) => next.add(t._id)); // select all visible
      }
      return next;
    });
  };

  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };
  const waitingCount = tickets.filter(isWaiting).length;
  const overdueCount = tickets.filter(isOverdue).length;

  const stats = [
    { key: 'all', label: 'Tickets gesamt', value: counts.all, Icon: IconInbox, tone: 'accent' },
    { key: 'open', label: 'Offen', value: counts.open, Icon: IconCircle, tone: 'blue' },
    { key: 'in_progress', label: 'In Bearbeitung', value: counts.in_progress, Icon: IconClock, tone: 'amber' },
    { key: 'closed', label: 'Geschlossen', value: counts.closed, Icon: IconCheck, tone: 'green' },
  ];

  const resetFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setAttention('all');
    setSearch('');
  };

  // Response indicator for a ticket's time cell.
  const respChip = (t) => {
    if (isOverdue(t)) return <span className="resp-chip resp-overdue"><span className="dot fill-red" />Überfällig</span>;
    if (hasReply(t)) return <span className="resp-chip resp-answered"><span className="dot fill-green" />Beantwortet</span>;
    if (isWaiting(t)) return <span className="resp-chip resp-waiting"><span className="dot fill-amber" />Wartet</span>;
    return <span className="resp-chip resp-none">—</span>;
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Tickets</h1>
          <p className="page-sub">Gästeanfragen — automatisch kategorisiert, priorisiert und geroutet</p>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={() => loadTickets(true)}
          disabled={refreshing || loading}
          aria-label="Tickets aktualisieren"
        >
          <span className={refreshing ? 'spin' : ''}><IconRefresh size={16} /></span>
          Aktualisieren
        </button>
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

      {/* Quick filters — the "needs attention" queue */}
      <div className="quickbar">
        <span className="quickbar-label">Schnellfilter</span>
        <button
          type="button"
          className={`chip ${attention === 'waiting' ? 'chip-active' : ''}`}
          onClick={() => toggleAttention('waiting')}
          aria-pressed={attention === 'waiting'}
        >
          <span className="dot fill-amber" /> Wartet auf Antwort
          <span className="chip-count">{waitingCount}</span>
        </button>
        <button
          type="button"
          className={`chip ${attention === 'overdue' ? 'chip-active' : ''} ${overdueCount > 0 ? 'chip-alarm' : ''}`}
          onClick={() => toggleAttention('overdue')}
          aria-pressed={attention === 'overdue'}
        >
          <span className="dot fill-red" /> Überfällig (&gt; {OVERDUE_HRS} Std)
          <span className="chip-count">{overdueCount}</span>
        </button>
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
          <select className="select" aria-label="Sortieren" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
            <option value="priority">Nach Priorität</option>
            <option value="waiting">Längste Wartezeit</option>
          </select>
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
        <div className="banner-error" role="alert">
          Fehler beim Laden: {error}
          <button onClick={() => loadTickets(true)} className="banner-retry">Erneut versuchen</button>
        </div>
      )}

      {/* Bulk action bar — appears once tickets are selected */}
      {selected.size > 0 && (
        <div className="bulkbar" role="region" aria-label="Aktionen für ausgewählte Tickets" aria-live="polite">
          <span className="bulkbar-count" aria-busy={bulkBusy}>{selected.size} ausgewählt</span>
          <span className="bulkbar-sep" aria-hidden="true" />
          <span className="bulkbar-label">Status setzen:</span>
          <button type="button" className="bulk-btn" disabled={bulkBusy} onClick={() => bulkUpdateStatus('open')}>
            <span className="dot fill-blue" /> Offen
          </button>
          <button type="button" className="bulk-btn" disabled={bulkBusy} onClick={() => bulkUpdateStatus('in_progress')}>
            <span className="dot fill-amber" /> In Bearbeitung
          </button>
          <button type="button" className="bulk-btn" disabled={bulkBusy} onClick={() => bulkUpdateStatus('closed')}>
            <IconCheck size={14} /> Geschlossen
          </button>
          <button type="button" className="bulkbar-clear" onClick={clearSelection}>
            Auswahl aufheben
          </button>
        </div>
      )}

      {/* Table card */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="col-check">
                  <input
                    type="checkbox"
                    className="tbl-check"
                    aria-label="Alle sichtbaren Tickets auswählen"
                    checked={allVisibleSelected}
                    ref={(el) => { if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected; }}
                    onChange={toggleAll}
                    disabled={loading || rows.length === 0}
                  />
                </th>
                <th>Gast</th>
                <th>Betreff</th>
                <th>Kategorie</th>
                <th>Priorität</th>
                <th>Stimmung</th>
                <th>Team</th>
                <th>Eingegangen</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="tbl-empty"><div className="spinner" /></td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="tbl-empty">
                    <div className="empty-title">Keine Tickets mit diesen Filtern</div>
                    <button type="button" className="empty-action" onClick={resetFilters}>
                      Filter zurücksetzen
                    </button>
                  </td>
                </tr>
              ) : (
                rows.map((t) => {
                  const cat = CATEGORY[t.category] || CATEGORY.other;
                  const prio = PRIORITY[t.priority] || PRIORITY.medium;
                  const sent = SENTIMENT[t.sentiment] || SENTIMENT.neutral;
                  const CatIcon = cat.Icon;
                  const overdue = isOverdue(t);
                  const checked = selected.has(t._id);
                  return (
                    <tr
                      key={t._id}
                      className={`tbl-row ${overdue ? 'row-overdue' : ''} ${checked ? 'row-selected' : ''}`}
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
                      <td className="col-check" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="tbl-check"
                          checked={checked}
                          onChange={(e) => toggleOne(t._id, e)}
                          aria-label={`Ticket von ${t.guestName} auswählen`}
                        />
                      </td>
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
                      <td>
                        <div className="time-cell">
                          <span
                            className={`time-rel ${overdue ? 'time-overdue' : ''}`}
                            title={new Date(t.createdAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}
                          >
                            {relativeTime(t.createdAt)}
                          </span>
                          {respChip(t)}
                        </div>
                      </td>
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
