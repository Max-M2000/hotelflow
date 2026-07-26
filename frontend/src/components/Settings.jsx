import React, { useState, useEffect } from 'react';
import { routingRuleAPI } from '../services/api';
import {
  IconUsers, IconPlus, IconTrash, IconArrowRight,
  IconAlert, IconCalendar, IconHelp, IconDots,
} from './Icons';
import '../styles/dashboard.css';
import '../styles/detail.css';
import '../styles/settings.css';

const CATEGORY = {
  complaint: { label: 'Beschwerde', cls: 'red', Icon: IconAlert },
  booking: { label: 'Buchung', cls: 'green', Icon: IconCalendar },
  inquiry: { label: 'Anfrage', cls: 'blue', Icon: IconHelp },
  other: { label: 'Sonstiges', cls: 'gray', Icon: IconDots },
};
const PRIORITY = {
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
};

const Settings = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // New-rule form state
  const [category, setCategory] = useState('complaint');
  const [assignTo, setAssignTo] = useState('');
  const [priority, setPriority] = useState('');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await routingRuleAPI.getRules();
      setRules(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!assignTo.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await routingRuleAPI.createRule({
        category,
        assignTo: assignTo.trim(),
        priority: priority || undefined,
      });
      setAssignTo('');
      setPriority('');
      await loadRules();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await routingRuleAPI.deleteRule(id);
      setRules((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleSeed = async () => {
    setSaving(true);
    setError(null);
    try {
      await routingRuleAPI.seedDefaults();
      await loadRules();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="detail-head">
        <h1 className="detail-title">Einstellungen</h1>
        <p className="settings-subtitle">
          Lege fest, an welches Team eingehende Tickets automatisch weitergeleitet werden.
        </p>
      </div>

      <div className="settings-grid">
        {/* Rules list */}
        <div className="card">
          <div className="card-title">
            <IconUsers size={17} /> Routing-Regeln
            <span className="count-badge">{rules.length}</span>
          </div>

          {loading ? (
            <div className="settings-loading"><div className="spinner" /></div>
          ) : rules.length === 0 ? (
            <div className="settings-empty">
              <p>Noch keine Regeln. Ohne Regel landet alles bei <strong>Rezeption</strong> (Standard).</p>
              <button className="btn-primary" onClick={handleSeed} disabled={saving}>
                {saving ? 'Lädt…' : 'Standard-Regeln laden'}
              </button>
            </div>
          ) : (
            <ul className="rule-list">
              {rules.map((rule) => {
                const cat = CATEGORY[rule.category] || CATEGORY.other;
                const CatIcon = cat.Icon;
                return (
                  <li key={rule._id} className="rule-row">
                    <span className={`pill tint-${cat.cls}`}><CatIcon size={13} />{cat.label}</span>
                    {rule.priority && (
                      <span className="rule-filter">Priorität: {PRIORITY[rule.priority] || rule.priority}</span>
                    )}
                    <IconArrowRight size={16} />
                    <span className="rule-team">{rule.assignTo}</span>
                    <button
                      className="rule-delete"
                      onClick={() => handleDelete(rule._id)}
                      aria-label={`Regel ${cat.label} → ${rule.assignTo} löschen`}
                      title="Regel löschen"
                    >
                      <IconTrash size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {error && <div className="banner-error" role="alert">{error}</div>}
        </div>

        {/* Add rule */}
        <div className="card">
          <div className="card-title"><IconPlus size={17} /> Neue Regel</div>
          <form onSubmit={handleAdd} className="rule-form">
            <label className="field-label" htmlFor="rule-category">Kategorie</label>
            <select id="rule-category" className="field-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="complaint">Beschwerde</option>
              <option value="booking">Buchung</option>
              <option value="inquiry">Anfrage</option>
              <option value="other">Sonstiges</option>
            </select>

            <label className="field-label" htmlFor="rule-priority">Nur bei Priorität (optional)</label>
            <select id="rule-priority" className="field-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">Alle Prioritäten</option>
              <option value="high">Hoch</option>
              <option value="medium">Mittel</option>
              <option value="low">Niedrig</option>
            </select>

            <label className="field-label" htmlFor="rule-team">Zuständiges Team</label>
            <input
              id="rule-team"
              className="field-input"
              type="text"
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              placeholder="z.B. Management, Reservierung, Rezeption"
            />

            <button type="submit" className="btn-primary" disabled={saving || !assignTo.trim()}>
              <IconPlus size={15} /> {saving ? 'Speichern…' : 'Regel hinzufügen'}
            </button>
          </form>

          <p className="rule-hint">
            Regeln greifen nach Kategorie. Eine Prioritäts-Regel (z.&nbsp;B. „Beschwerde + Hoch → Management")
            hat Vorrang, wenn sie passt.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
