import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { IconPlus, IconTrash, IconCheck, IconSend } from './Icons';
import '../styles/dashboard.css';
import '../styles/detail.css';
import '../styles/settings.css';

const Settings = () => {
  const [signature, setSignature] = useState('');
  const [savedSignature, setSavedSignature] = useState('');
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

  return (
    <div className="page">
      <div className="detail-head">
        <h1 className="detail-title">Einstellungen</h1>
        <p className="settings-subtitle">
          Richte Signatur und Antwort-Vorlagen ein — sie stehen deinem Team beim Antworten mit einem Klick zur Verfügung.
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
