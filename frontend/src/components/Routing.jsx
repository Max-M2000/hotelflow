import React, { useState, useEffect } from 'react';
import { routingRuleAPI } from '../services/api';
import {
  IconPlus, IconTrash, IconArrowRight, IconCheck,
  IconAlert, IconCalendar, IconHelp, IconDots,
} from './Icons';
import '../styles/dashboard.css';
import '../styles/detail.css';
import '../styles/settings.css';

const CATEGORIES = [
  { key: 'complaint', label: 'Beschwerde', cls: 'red', Icon: IconAlert },
  { key: 'booking', label: 'Buchung', cls: 'green', Icon: IconCalendar },
  { key: 'inquiry', label: 'Anfrage', cls: 'blue', Icon: IconHelp },
  { key: 'other', label: 'Sonstiges', cls: 'gray', Icon: IconDots },
];
const PRIORITY = { high: 'Hoch', medium: 'Mittel', low: 'Niedrig' };

// One card per category: base team + optional priority exceptions.
const CategoryCard = ({ cat, baseRule, exceptions, onSaveBase, onAddException, onDelete }) => {
  const [team, setTeam] = useState(baseRule?.assignTo || '');
  const [busy, setBusy] = useState(false);
  const [exOpen, setExOpen] = useState(false);
  const [exPriority, setExPriority] = useState('high');
  const [exTeam, setExTeam] = useState('');

  useEffect(() => {
    setTeam(baseRule?.assignTo || '');
  }, [baseRule]);

  const dirty = team.trim() !== (baseRule?.assignTo || '') && team.trim() !== '';
  const CatIcon = cat.Icon;

  const saveBase = async () => {
    setBusy(true);
    await onSaveBase(cat.key, team.trim(), baseRule);
    setBusy(false);
  };

  const addException = async (e) => {
    e.preventDefault();
    if (!exTeam.trim()) return;
    setBusy(true);
    await onAddException(cat.key, exPriority, exTeam.trim());
    setExTeam('');
    setExOpen(false);
    setBusy(false);
  };

  // Priorities not yet used by an exception in this category.
  const usedPriorities = exceptions.map((r) => r.priority);
  const freePriorities = Object.keys(PRIORITY).filter((p) => !usedPriorities.includes(p));

  return (
    <div className="card cat-card">
      <div className="cat-head">
        <span className={`pill tint-${cat.cls}`}><CatIcon size={13} />{cat.label}</span>
      </div>

      {/* Base team */}
      <div className="cat-base">
        <label className="field-label" htmlFor={`team-${cat.key}`}>Standard-Team</label>
        <div className="cat-base-row">
          <input
            id={`team-${cat.key}`}
            className="field-input"
            type="text"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder="z.B. Rezeption"
          />
          <button
            className="btn-primary cat-save"
            onClick={saveBase}
            disabled={busy || !dirty}
            title="Team speichern"
          >
            <IconCheck size={15} /> Speichern
          </button>
        </div>
      </div>

      {/* Exceptions */}
      {exceptions.length > 0 && (
        <ul className="exc-list">
          {exceptions.map((rule) => (
            <li key={rule._id} className="exc-row">
              <span className="exc-when">wenn Priorität <strong>{PRIORITY[rule.priority] || rule.priority}</strong></span>
              <IconArrowRight size={14} />
              <span className="exc-team">{rule.assignTo}</span>
              <button
                className="rule-delete"
                onClick={() => onDelete(rule._id)}
                aria-label={`Ausnahme ${PRIORITY[rule.priority]} → ${rule.assignTo} löschen`}
                title="Ausnahme löschen"
              >
                <IconTrash size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add exception */}
      {exOpen ? (
        <form onSubmit={addException} className="exc-form">
          <select className="field-select exc-prio" value={exPriority} onChange={(e) => setExPriority(e.target.value)} aria-label="Priorität der Ausnahme">
            {freePriorities.map((p) => (
              <option key={p} value={p}>{PRIORITY[p]}</option>
            ))}
          </select>
          <input
            className="field-input"
            type="text"
            value={exTeam}
            onChange={(e) => setExTeam(e.target.value)}
            placeholder="Team für diese Priorität"
            aria-label="Team der Ausnahme"
          />
          <button type="submit" className="btn-primary" disabled={busy || !exTeam.trim()}>Hinzufügen</button>
          <button type="button" className="btn-ghost" onClick={() => setExOpen(false)}>Abbrechen</button>
        </form>
      ) : (
        freePriorities.length > 0 && (
          <button className="exc-add" onClick={() => { setExPriority(freePriorities[0]); setExOpen(true); }}>
            <IconPlus size={14} /> Ausnahme nach Priorität
          </button>
        )
      )}
    </div>
  );
};

const Routing = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const wrap = async (fn) => {
    setError(null);
    try {
      await fn();
      await loadRules();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleSaveBase = (category, team, baseRule) =>
    wrap(() =>
      baseRule
        ? routingRuleAPI.updateRule(baseRule._id, { assignTo: team })
        : routingRuleAPI.createRule({ category, assignTo: team })
    );

  const handleAddException = (category, priority, team) =>
    wrap(() => routingRuleAPI.createRule({ category, priority, assignTo: team }));

  const handleDelete = (id) => wrap(() => routingRuleAPI.deleteRule(id));

  return (
    <div className="page">
      <div className="detail-head">
        <h1 className="detail-title">Team-Routing</h1>
        <p className="settings-subtitle">
          Lege pro Kategorie fest, welches Team zuständig ist. Optional pro Priorität eine Ausnahme.
        </p>
      </div>

      {error && <div className="banner-error" role="alert">{error}</div>}

      {loading ? (
        <div className="settings-loading"><div className="spinner" /></div>
      ) : (
        <div className="cat-stack">
          {CATEGORIES.map((cat) => {
            const baseRule = rules.find((r) => r.category === cat.key && !r.priority);
            const exceptions = rules
              .filter((r) => r.category === cat.key && r.priority)
              .sort((a, b) => a.priority.localeCompare(b.priority));
            return (
              <CategoryCard
                key={cat.key}
                cat={cat}
                baseRule={baseRule}
                exceptions={exceptions}
                onSaveBase={handleSaveBase}
                onAddException={handleAddException}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}

      <p className="rule-hint">
        Ohne passende Regel wird ein Ticket der <strong>Rezeption</strong> zugewiesen (Fallback).
        Eine Prioritäts-Ausnahme hat immer Vorrang vor dem Standard-Team.
      </p>
    </div>
  );
};

export default Routing;
