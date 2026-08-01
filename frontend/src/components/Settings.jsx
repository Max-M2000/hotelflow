import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { IconPlus, IconTrash, IconCheck, IconSend } from './Icons';
import '../styles/dashboard.css';
import '../styles/detail.css';
import '../styles/settings.css';

const Settings = () => {
  const [signature, setSignature] = useState('');
  const [savedSignature, setSavedSignature] = useState('');
  const [houseInfo, setHouseInfo] = useState('');
  const [savedHouseInfo, setSavedHouseInfo] = useState('');
  const [savingHouse, setSavingHouse] = useState(false);
  const [houseSaved, setHouseSaved] = useState(false);
  const [replyStyle, setReplyStyle] = useState('professional');
  const [savedReplyStyle, setSavedReplyStyle] = useState('professional');
  const [styleNotes, setStyleNotes] = useState('');
  const [savedStyleNotes, setSavedStyleNotes] = useState('');
  const [savingStyle, setSavingStyle] = useState(false);
  const [styleSaved, setStyleSaved] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingSig, setSavingSig] = useState(false);
  const [sigSaved, setSigSaved] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newBody, setNewBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await settingsAPI.get();
      setSignature(data.signature || '');
      setSavedSignature(data.signature || '');
      setHouseInfo(data.houseInfo || '');
      setSavedHouseInfo(data.houseInfo || '');
      setReplyStyle(data.replyStyle || 'professional');
      setSavedReplyStyle(data.replyStyle || 'professional');
      setStyleNotes(data.styleNotes || '');
      setSavedStyleNotes(data.styleNotes || '');
      setTemplates(data.templates || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSignature = async () => {
    setSavingSig(true);
    setError(null);
    setSigSaved(false);
    try {
      const data = await settingsAPI.update({ signature });
      setSavedSignature(data.signature || '');
      setSigSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSavingSig(false);
    }
  };

  const saveHouseInfo = async () => {
    setSavingHouse(true);
    setError(null);
    setHouseSaved(false);
    try {
      const data = await settingsAPI.update({ houseInfo });
      setSavedHouseInfo(data.houseInfo || '');
      setHouseSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSavingHouse(false);
    }
  };

  const saveStyle = async () => {
    setSavingStyle(true);
    setError(null);
    setStyleSaved(false);
    try {
      const data = await settingsAPI.update({ replyStyle, styleNotes });
      setSavedReplyStyle(data.replyStyle || 'professional');
      setSavedStyleNotes(data.styleNotes || '');
      setStyleSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSavingStyle(false);
    }
  };

  const persistTemplates = async (next) => {
    setError(null);
    try {
      const data = await settingsAPI.update({ templates: next });
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const addTemplate = async (e) => {
    e.preventDefault();
    if (!newLabel.trim() || !newBody.trim()) return;
    setBusy(true);
    await persistTemplates([...templates, { label: newLabel.trim(), body: newBody.trim() }]);
    setNewLabel('');
    setNewBody('');
    setBusy(false);
  };

  const deleteTemplate = async (idx) => {
    setBusy(true);
    await persistTemplates(templates.filter((_, i) => i !== idx));
    setBusy(false);
  };

  const sigDirty = signature !== savedSignature;
  const houseDirty = houseInfo !== savedHouseInfo;
  const styleDirty = replyStyle !== savedReplyStyle || styleNotes !== savedStyleNotes;

  return (
    <div className="page">
      <div className="detail-head">
        <h1 className="detail-title">Einstellungen</h1>
        <p className="settings-subtitle">
          Signatur, Hausinformationen und Antwort-Vorlagen einrichten. Sie stehen deinem Team beim Antworten mit einem Klick zur Verfügung und fließen in die KI-Antwortvorschläge ein.
        </p>
      </div>

      {error && <div className="banner-error" role="alert">{error}</div>}

      {loading ? (
        <div className="settings-loading"><div className="spinner" /></div>
      ) : (
        <div className="settings-stack">
          {/* Signature */}
          <div className="card set-card">
            <div className="card-title">Signatur</div>
            <p className="set-hint">
              Wird über den Button „Signatur“ ans Ende einer Antwort eingefügt. Nutze <code>{'{name}'}</code> für den Vornamen des Gastes.
            </p>
            <textarea
              className="note-input set-textarea"
              value={signature}
              onChange={(e) => { setSignature(e.target.value); setSigSaved(false); }}
              rows="4"
              aria-label="Signatur"
              placeholder="Herzliche Grüße…"
            />
            <div className="set-actions">
              <button className="btn-primary" onClick={saveSignature} disabled={savingSig || !sigDirty}>
                <IconCheck size={15} /> {savingSig ? 'Speichern…' : 'Signatur speichern'}
              </button>
              {sigSaved && !sigDirty && <span className="set-saved" role="status">Gespeichert ✓</span>}
            </div>
          </div>

          {/* Antwort-Stil */}
          <div className="card set-card">
            <div className="card-title">Antwort-Stil</div>
            <p className="set-hint">
              Wie sollen die <strong>KI-Antwortvorschläge</strong> klingen? Anrede und Ton wählen, optional zusätzliche Wünsche ergänzen.
            </p>
            <label className="tpl-add-label" htmlFor="reply-style">Anrede &amp; Ton</label>
            <select
              id="reply-style"
              className="field-input"
              value={replyStyle}
              onChange={(e) => { setReplyStyle(e.target.value); setStyleSaved(false); }}
            >
              <option value="formal">Sehr formell – „Sehr geehrte/r …“</option>
              <option value="professional">Professionell &amp; freundlich – „Guten Tag …“ (Standard)</option>
              <option value="casual">Locker &amp; herzlich – „Hallo …“</option>
            </select>
            <label className="tpl-add-label" htmlFor="style-notes" style={{ marginTop: '14px' }}>Weitere Stil-Wünsche (optional)</label>
            <textarea
              id="style-notes"
              className="note-input set-textarea"
              value={styleNotes}
              onChange={(e) => { setStyleNotes(e.target.value); setStyleSaved(false); }}
              rows="2"
              aria-label="Weitere Stil-Wünsche"
              placeholder="z. B. Kurz halten. Grußformel „Mit freundlichen Grüßen“. Keine Emojis."
            />
            <div className="set-actions">
              <button className="btn-primary" onClick={saveStyle} disabled={savingStyle || !styleDirty}>
                <IconCheck size={15} /> {savingStyle ? 'Speichern…' : 'Antwort-Stil speichern'}
              </button>
              {styleSaved && !styleDirty && <span className="set-saved" role="status">Gespeichert ✓</span>}
            </div>
          </div>

          {/* Hausinformationen */}
          <div className="card set-card">
            <div className="card-title">Hausinformationen</div>
            <p className="set-hint">
              Ihre festen Fakten (Check-in/-out, WLAN, Parken, Frühstück, Haustiere …). Die <strong>KI-Antwortvorschläge</strong> nutzen diese Angaben, um Gästen echte Auskünfte zu geben statt Platzhalter. Was hier nicht steht, bleibt im Entwurf ein Platzhalter zum Ausfüllen.
            </p>
            <textarea
              className="note-input set-textarea"
              value={houseInfo}
              onChange={(e) => { setHouseInfo(e.target.value); setHouseSaved(false); }}
              rows="6"
              aria-label="Hausinformationen"
              placeholder={'Check-in ab 15 Uhr, Check-out bis 11 Uhr.\nWLAN kostenlos, Passwort an der Rezeption.\nParkplätze am Haus, 10 € pro Nacht.\nFrühstück 7 bis 10 Uhr.\nHaustiere auf Anfrage.'}
            />
            <div className="set-actions">
              <button className="btn-primary" onClick={saveHouseInfo} disabled={savingHouse || !houseDirty}>
                <IconCheck size={15} /> {savingHouse ? 'Speichern…' : 'Hausinformationen speichern'}
              </button>
              {houseSaved && !houseDirty && <span className="set-saved" role="status">Gespeichert ✓</span>}
            </div>
          </div>

          {/* Templates */}
          <div className="card set-card">
            <div className="card-title">
              Antwort-Vorlagen <span className="count-badge">{templates.length}</span>
            </div>
            <p className="set-hint">
              Häufige Antworten als Baustein — mit einem Klick ins Antwortfeld. <code>{'{name}'}</code> wird durch den Vornamen des Gastes ersetzt.
            </p>

            {templates.length > 0 ? (
              <ul className="tpl-list">
                {templates.map((tpl, i) => (
                  <li key={i} className="tpl-item">
                    <div className="tpl-item-main">
                      <div className="tpl-item-label">{tpl.label}</div>
                      <div className="tpl-item-body">{tpl.body}</div>
                    </div>
                    <button
                      className="rule-delete"
                      onClick={() => deleteTemplate(i)}
                      disabled={busy}
                      aria-label={`Vorlage „${tpl.label}“ löschen`}
                      title="Vorlage löschen"
                    >
                      <IconTrash size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="notes-empty">Noch keine Vorlagen.</p>
            )}

            <form onSubmit={addTemplate} className="tpl-add-form">
              <div className="tpl-add-label">Neue Vorlage</div>
              <input
                className="field-input"
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Name, z. B. Frühstückszeiten…"
                aria-label="Name der Vorlage"
                autoComplete="off"
                maxLength={40}
              />
              <textarea
                className="note-input"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Text der Vorlage… (z. B. Unser Frühstück gibt es von 7 bis 10 Uhr.)"
                aria-label="Text der Vorlage"
                rows="3"
              />
              <button type="submit" className="btn-primary" disabled={busy || !newLabel.trim() || !newBody.trim()}>
                <IconPlus size={15} /> Vorlage hinzufügen
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
