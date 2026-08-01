import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketAPI, settingsAPI, authAPI } from '../services/api';
import { IconArrowLeft, IconAlert, IconCalendar, IconHelp, IconDots, IconSend, IconMessage } from './Icons';
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
  return `vor ${Math.floor(days / 7)} Wo`;
};

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState(null);
  const [replySuccess, setReplySuccess] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [signature, setSignature] = useState('');

  useEffect(() => {
    loadTicket();
  }, [id]);

  // Load the hotel's signature + reply templates once.
  useEffect(() => {
    settingsAPI
      .get()
      .then((s) => {
        setTemplates(s.templates || []);
        setSignature(s.signature || '');
      })
      .catch(() => {}); // non-blocking — reply still works without templates
    // Prefer the logged-in user's personal signature for the "Signatur" button.
    authAPI
      .me()
      .then((res) => {
        const mySig = res.user && res.user.signature;
        if (mySig && mySig.trim()) setSignature(mySig);
      })
      .catch(() => {});
  }, []);

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

  const insertTemplate = (text) => {
    setReplyBody((prev) => {
      if (!prev.trim()) return text;
      return prev.endsWith('\n') ? prev + text : prev + '\n' + text;
    });
  };

  const handleSuggest = async () => {
    setSuggesting(true);
    setSuggestError(null);
    try {
      const { draft } = await ticketAPI.suggestReply(id);
      if (draft) setReplyBody(draft);
    } catch (err) {
      setSuggestError(err.response?.data?.error || err.message);
    } finally {
      setSuggesting(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSendingReply(true);
    setReplyError(null);
    setReplySuccess(false);
    try {
      const user = localStorage.getItem('hotelflow_user') || 'Mitarbeiter';
      const updated = await ticketAPI.replyToTicket(id, {
        subject: replySubject.trim() || `Re: ${ticket.subject}`,
        body: replyBody.trim(),
        author: user,
      });
      setTicket(updated);
      setReplyBody('');
      setReplySubject('');
      setReplySuccess(true);
    } catch (err) {
      setReplyError(err.response?.data?.error || err.message);
    } finally {
      setSendingReply(false);
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

  const firstName = (ticket.guestName || '').split(' ')[0];
  const fillPlaceholders = (text) => (text || '').replace(/\{name\}/g, firstName);

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
          <span className="detail-date">{formatDate(ticket.createdAt)} · {relativeTime(ticket.createdAt)}</span>
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

          <div className="card reply-card">
            <div className="card-title">
              Dem Gast antworten
              {ticket.replies?.length > 0 && (
                <span className="count-badge">{ticket.replies.length}</span>
              )}
            </div>

            {ticket.replies && ticket.replies.length > 0 && (
              <div className="reply-list">
                {ticket.replies.map((r, i) => (
                  <div key={i} className="reply-sent">
                    <div className="reply-meta">
                      <span className="reply-author">{r.author}</span>
                      <span className="reply-arrow">→ {r.to}</span>
                      <span className="note-date">{formatDate(r.sentAt)}</span>
                    </div>
                    <div className="reply-subject">{r.subject}</div>
                    <div className="reply-text">{r.body}</div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendReply} className="reply-form">
              <label className="field-label" htmlFor="reply-subject">Betreff</label>
              <input
                id="reply-subject"
                className="field-input"
                type="text"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                placeholder={`Re: ${ticket.subject}`}
              />

              <label className="field-label" htmlFor="reply-body">Nachricht an {ticket.guestEmail}</label>
              <div className="suggest-row">
                <button
                  type="button"
                  className="btn-suggest"
                  onClick={handleSuggest}
                  disabled={suggesting}
                >
                  <IconMessage size={15} /> {suggesting ? 'Entwurf wird erstellt…' : 'KI-Antwort vorschlagen'}
                </button>
                <span className="suggest-hint">Vorschlag prüfen und bei Bedarf anpassen, bevor Sie senden.</span>
              </div>
              {suggestError && <div className="banner-error" role="alert">{suggestError}</div>}
              <div className="tpl-row" role="group" aria-label="Antwort-Vorlagen einfügen">
                <span className="tpl-label">Vorlagen:</span>
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    className="tpl-btn"
                    onClick={() => insertTemplate(fillPlaceholders(tpl.body))}
                  >
                    {tpl.label}
                  </button>
                ))}
                {signature && (
                  <button
                    type="button"
                    className="tpl-btn tpl-btn-sig"
                    onClick={() => insertTemplate(fillPlaceholders(signature))}
                  >
                    Signatur
                  </button>
                )}
                {templates.length === 0 && !signature && (
                  <span className="tpl-empty">Unter „Einstellungen“ anlegen</span>
                )}
              </div>
              <textarea
                id="reply-body"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Antwort an den Gast verfassen…"
                className="note-input"
                rows="5"
              />

              {replyError && <div className="banner-error" role="alert">{replyError}</div>}
              {replySuccess && <div className="banner-success" role="status">Antwort gesendet ✅</div>}

              <button type="submit" disabled={sendingReply || !replyBody.trim()} className="btn-primary">
                <IconSend size={15} /> {sendingReply ? 'Senden…' : 'Antwort senden'}
              </button>
            </form>
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
                aria-label="Neue interne Notiz"
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

            <label className="field-label" htmlFor="field-status">Status</label>
            <select id="field-status" className="field-select" value={ticket.status} onChange={(e) => updateField('status', e.target.value)}>
              <option value="open">Offen</option>
              <option value="in_progress">In Bearbeitung</option>
              <option value="closed">Geschlossen</option>
            </select>

            <label className="field-label" htmlFor="field-priority">Priorität</label>
            <select id="field-priority" className="field-select" value={ticket.priority} onChange={(e) => updateField('priority', e.target.value)}>
              <option value="high">Hoch</option>
              <option value="medium">Mittel</option>
              <option value="low">Niedrig</option>
            </select>

            <label className="field-label" htmlFor="field-team">Zugewiesenes Team</label>
            <input
              id="field-team"
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
