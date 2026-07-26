import React, { useState, useEffect } from 'react';
import { ticketAPI } from '../services/api';
import {
  IconInbox, IconAlert, IconClock, IconCheck,
  IconCalendar, IconHelp, IconDots, IconUsers,
} from './Icons';
import '../styles/dashboard.css';
import '../styles/reports.css';

const CATEGORY = {
  complaint: { label: 'Beschwerde', cls: 'red' },
  booking: { label: 'Buchung', cls: 'green' },
  inquiry: { label: 'Anfrage', cls: 'blue' },
  other: { label: 'Sonstiges', cls: 'gray' },
};
const SENTIMENT = {
  negative: { label: 'Unzufrieden', cls: 'negative' },
  neutral: { label: 'Neutral', cls: 'neutral' },
  positive: { label: 'Zufrieden', cls: 'positive' },
};

const formatDuration = (ms) => {
  if (ms == null || isNaN(ms)) return '–';
  const mins = Math.round(ms / 60000);
  if (mins < 1) return '< 1 Min';
  if (mins < 60) return `${mins} Min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return m ? `${h} Std ${m} Min` : `${h} Std`;
  const d = Math.floor(h / 24);
  return `${d} ${d === 1 ? 'Tag' : 'Tage'} ${h % 24} Std`;
};

const Bar = ({ label, cls, count, max }) => (
  <div className="bar-row">
    <span className="bar-label">
      <span className={`dot fill-${cls}`} /> {label}
    </span>
    <span className="bar-track">
      <span className={`bar-fill fill-${cls}`} style={{ width: `${max ? (count / max) * 100 : 0}%` }} />
    </span>
    <span className="bar-count">{count}</span>
  </div>
);

const Reports = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await ticketAPI.getTickets();
        setTickets(data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = tickets.length;
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const complaintsWeek = tickets.filter(
    (t) => t.category === 'complaint' && new Date(t.createdAt).getTime() >= weekAgo
  ).length;
  const replied = tickets.filter((t) => t.replies && t.replies.length > 0);
  const answeredRate = total ? Math.round((replied.length / total) * 100) : 0;
  const avgResp = replied.length
    ? replied.reduce((s, t) => s + (new Date(t.replies[0].sentAt) - new Date(t.createdAt)), 0) / replied.length
    : null;

  const catData = Object.entries(CATEGORY).map(([key, c]) => ({
    ...c, count: tickets.filter((t) => t.category === key).length,
  }));
  const catMax = Math.max(1, ...catData.map((c) => c.count));

  const sentData = Object.entries(SENTIMENT).map(([key, s]) => ({
    ...s, count: tickets.filter((t) => t.sentiment === key).length,
  }));
  const sentMax = Math.max(1, ...sentData.map((s) => s.count));

  const teamMap = {};
  tickets.forEach((t) => {
    const team = t.assignedTo || '—';
    teamMap[team] = (teamMap[team] || 0) + 1;
  });
  const teamData = Object.entries(teamMap)
    .map(([team, count]) => ({ team, count }))
    .sort((a, b) => b.count - a.count);
  const teamMax = Math.max(1, ...teamData.map((t) => t.count));

  const kpis = [
    { label: 'Tickets gesamt', value: total, Icon: IconInbox, tone: 'accent' },
    { label: 'Beschwerden (7 Tage)', value: complaintsWeek, Icon: IconAlert, tone: 'red' },
    { label: 'Ø Antwortzeit', value: formatDuration(avgResp), Icon: IconClock, tone: 'amber' },
    { label: 'Beantwortet', value: `${answeredRate}%`, Icon: IconCheck, tone: 'green' },
  ];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Berichte</h1>
          <p className="page-sub">Überblick über Aufkommen, Stimmung und Bearbeitung</p>
        </div>
      </header>

      {error && <div className="banner-error" role="alert">Fehler beim Laden: {error}</div>}

      {loading ? (
        <div className="reports-loading"><div className="spinner" /></div>
      ) : total === 0 ? (
        <div className="reports-empty">Noch keine Tickets — sobald Anfragen eingehen, erscheinen hier die Auswertungen.</div>
      ) : (
        <>
          {/* KPI tiles */}
          <div className="stat-grid">
            {kpis.map((k) => (
              <div key={k.label} className="stat-card stat-card-static">
                <div className="stat-top">
                  <span className="stat-label">{k.label}</span>
                  <span className={`stat-icon tone-${k.tone}`}><k.Icon size={16} /></span>
                </div>
                <div className="stat-value">{k.value}</div>
              </div>
            ))}
          </div>

          {/* Distributions */}
          <div className="reports-cards">
            <div className="rep-card">
              <div className="rep-title"><IconHelp size={16} /> Nach Kategorie</div>
              {catData.map((c) => (
                <Bar key={c.label} label={c.label} cls={c.cls} count={c.count} max={catMax} />
              ))}
            </div>

            <div className="rep-card">
              <div className="rep-title"><IconAlert size={16} /> Nach Stimmung</div>
              {sentData.map((s) => (
                <Bar key={s.label} label={s.label} cls={s.cls} count={s.count} max={sentMax} />
              ))}
            </div>

            <div className="rep-card rep-card-wide">
              <div className="rep-title"><IconUsers size={16} /> Nach Team</div>
              {teamData.map((t) => (
                <div key={t.team} className="bar-row">
                  <span className="bar-label bar-label-team">{t.team}</span>
                  <span className="bar-track">
                    <span className="bar-fill fill-accent" style={{ width: `${(t.count / teamMax) * 100}%` }} />
                  </span>
                  <span className="bar-count">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
