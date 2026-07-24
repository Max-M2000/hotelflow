import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/api';
import { IconArrowLeft, IconAlert, IconCalendar, IconHelp, IconDots, IconSend } from './Icons';
import '../styles/detail.css';

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
const SENTIMENT = {
  positive: { label: 'Zufrieden', cls: 'positive' },
  neutral: { label: 'Neutral', cls: 'neutral' },
  negative: { label: 'Unzufrieden', cls: 'negative' },
};

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const data = await ticketAPI.getTicket(id);
      setTicket(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = async (field, value) => {
    try {
      const updated = await ticketAPI.updateTicket(id, { [field]: value });
      setTicket(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const user = localStorage.getItem('hotelflow_user') || 'Mitarbeiter';
      const updated = await ticketAPI.addNote(id, user, noteText.trim());
      setTicket(updated);
      setNoteText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }) : '';

  if (loading) {
    return (
      <div className="page">
        <div className="detail-loading"><div className="spinner" /></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="page">
        <button onClick={() => navigate('/')} className="back-link"><IconArrowLeft size={16} /> Zurück</button>
        <div className="banner-error">{error || 'Ticket nicht gefunden'}</div>
      </div>
    );
  }

  const cat = CATEGORY[ticket.category] || CATEGORY.other;
  const prio = PRIORITY[ticket.priority] || PRIORITY.medium;
  const sent = SENTIMENT[ticket.sentiment] || SENTIMENT.neutral;
  const CatIcon = cat.Icon;

  return (
    <div className="page">
      <button onClick={() => navigate('/')} className="back-link">
        <IconArrowLeft size={16} /> Zurück zur Übersicht
      </button>

      <div className="detail-head">
        <h1 className="detail-title">{ticket.subject}</h1>
        <div className="detail-meta">
          <span className={`pill tint-${cat.cls}`}><CatIcon size={13} />{cat.label}</span>
          <span className={`pill tint-${prio.cls}`}>Priorität: {prio.label}</span>
          <span className="detail-date">{formatDate(ticket.createdAt)}</span>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left column */}
        <div className="detail-main">
          <div className="card email-card">
            <div className="email-head">
              <span className="email-avatar">{(ticket.guestName || '?').charAt(0).toUpperCase()}</span>
              <div className="email-from">
                <div className="email-name">{ticket.guestName}</div>
                <div className="email-mail">{ticket.guestEmail}</div>
              </div>
            </div>
            <div className="email-body">{ticket.body}</div>
          </div>

          <div className="card notes-card">
            <div className="card-title">Interne Notizen <span className="count-badge">{ticket.notes?.length || 0}</span></div>

            {ticket.notes && ticket.notes.length > 0 ? (
              <div className="notes-list">
                {ticket.notes.map((note, i) => (
                  <div key={i} className="note">
                    <span className="note-avatar">{(note.author || '?').charAt(0).toUpperCase()}</span>
                    <div className="note-body">
                      <div className="note-meta">
                        <span className="note-author">{note.author}</span>
                        <span className="note-date">{formatDate(note.createdAt)}</span>
                      </div>
                      <div className="note-text">{note.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="notes-empty">Noch keine Notizen. Halte hier Bearbeitungsschritte fest.</p>
            )}

            <form onSubmit={handleAddNote} className="note-form">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Notiz oder Bearbeitungsvermerk hinzufügen…"
                className="note-input"
                rows="2"
              />
              <button type="submit" disabled={savingNote || !noteText.trim()} className="btn-primary">
                <IconSend size={15} /> {savingNote ? 'Speichern…' : 'Hinzufügen'}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="detail-side">
          <div className="card side-card">
            <div className="card-title">KI-Analyse</div>
            <div className="side-row">
              <span className="side-label">Kategorie</span>
              <span className={`pill tint-${cat.cls}`}><CatIcon size={13} />{cat.label}</span>
            </div>
            <div className="side-row">
              <span className="side-label">Priorität</span>
              <span className={`pill tint-${prio.cls}`}>{prio.label}</span>
            </div>
            <div className="side-row">
              <span className="side-label">Stimmung</span>
              <span className="sentiment"><span className={`dot dot-${sent.cls}`} />{sent.label}</span>
            </div>
          </div>

          <div className="card side-card">
            <div className="card-title">Bearbeitung</div>

            <label className="field-label">Status</label>
            <select className="field-select" value={ticket.status} onChange={(e) => updateField('status', e.target.value)}>
              <option value="open">Offen</option>
              <option value="in_progress">In Bearbeitung</option>
              <option value="closed">Geschlossen</option>
            </select>

            <label className="field-label">Priorität</label>
            <select className="field-select" value={ticket.priority} onChange={(e) => updateField('priority', e.target.value)}>
              <option value="high">Hoch</option>
              <option value="medium">Mittel</option>
              <option value="low">Niedrig</option>
            </select>

            <label className="field-label">Zugewiesenes Team</label>
            <input
              className="field-input"
              type="text"
              defaultValue={ticket.assignedTo || ''}
              onBlur={(e) => {
                if (e.target.value !== (ticket.assignedTo || '')) updateField('assignedTo', e.target.value);
              }}
              placeholder="z.B. reception, complaint-team"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
