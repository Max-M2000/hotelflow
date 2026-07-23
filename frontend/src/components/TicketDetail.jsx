import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import '../styles/detail.css';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

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
      <div className="container">
        <div className="loadingState">
          <div className="spinner"></div>
          <p>Ticket wird geladen…</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container">
        <button onClick={() => navigate('/')} className="backButton">← Zurück</button>
        <div className="errorState">⚠️ {error || 'Ticket nicht gefunden'}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <button onClick={() => navigate('/')} className="backButton">← Zurück zur Übersicht</button>

      <div className="detailGrid">
        {/* Left: Original email */}
        <div className="detailMain">
          <div className="emailCard">
            <div className="emailHeader">
              <div className="emailAvatar">{(ticket.guestName || '?').charAt(0).toUpperCase()}</div>
              <div>
                <div className="emailGuestName">{ticket.guestName}</div>
                <div className="emailGuestEmail">{ticket.guestEmail}</div>
              </div>
              <div className="emailDate">{formatDate(ticket.createdAt)}</div>
            </div>
            <h2 className="emailSubject">{ticket.subject}</h2>
            <div className="emailBody">{ticket.body}</div>
          </div>

          {/* Notes / internal responses */}
          <div className="notesSection">
            <h3>Interne Notizen ({ticket.notes?.length || 0})</h3>
            {ticket.notes && ticket.notes.length > 0 ? (
              <div className="notesList">
                {ticket.notes.map((note, i) => (
                  <div key={i} className="noteItem">
                    <div className="noteMeta">
                      <span className="noteAuthor">{note.author}</span>
                      <span className="noteDate">{formatDate(note.createdAt)}</span>
                    </div>
                    <div className="noteText">{note.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="notesEmpty">Noch keine Notizen.</p>
            )}

            <form onSubmit={handleAddNote} className="noteForm">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Notiz oder Bearbeitungsvermerk hinzufügen…"
                className="noteInput"
                rows="3"
              />
              <button type="submit" disabled={savingNote || !noteText.trim()} className="noteButton">
                {savingNote ? 'Speichern…' : 'Notiz hinzufügen'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: AI analysis + controls */}
        <div className="detailSidebar">
          <div className="sidebarCard">
            <div className="sidebarTitle">KI-Analyse</div>

            <div className="analysisRow">
              <span className="analysisLabel">Kategorie</span>
              <span className="badge" style={{ backgroundColor: getCategoryColor(ticket.category, isDark) }}>
                {CATEGORY_LABELS[ticket.category] || ticket.category}
              </span>
            </div>
            <div className="analysisRow">
              <span className="analysisLabel">Priorität</span>
              <span className="badge" style={{ backgroundColor: getPriorityColor(ticket.priority, isDark) }}>
                {PRIORITY_LABELS[ticket.priority] || ticket.priority}
              </span>
            </div>
            <div className="analysisRow">
              <span className="analysisLabel">Stimmung</span>
              <span className="sentimentDot" style={{ color: getSentimentColor(ticket.sentiment, isDark) }}>
                ● {SENTIMENT_LABELS[ticket.sentiment] || '—'}
              </span>
            </div>
          </div>

          <div className="sidebarCard">
            <div className="sidebarTitle">Bearbeitung</div>

            <label className="controlLabel">Status</label>
            <select
              className="controlSelect"
              style={{ borderLeftColor: getStatusColor(ticket.status, isDark) }}
              value={ticket.status}
              onChange={(e) => updateField('status', e.target.value)}
            >
              <option value="open">Offen</option>
              <option value="in_progress">In Bearbeitung</option>
              <option value="closed">Geschlossen</option>
            </select>

            <label className="controlLabel">Priorität</label>
            <select
              className="controlSelect"
              value={ticket.priority}
              onChange={(e) => updateField('priority', e.target.value)}
            >
              <option value="high">Hoch</option>
              <option value="medium">Mittel</option>
              <option value="low">Niedrig</option>
            </select>

            <label className="controlLabel">Zugewiesenes Team</label>
            <input
              className="controlInput"
              type="text"
              defaultValue={ticket.assignedTo || ''}
              onBlur={(e) => {
                if (e.target.value !== (ticket.assignedTo || '')) {
                  updateField('assignedTo', e.target.value);
                }
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
