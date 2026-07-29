import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { IconUserPlus, IconTrash, IconKey, IconCheck, IconShield } from './Icons';
import '../styles/dashboard.css';
import '../styles/detail.css';
import '../styles/settings.css';
import '../styles/users.css';

const ROLE = {
  admin: { label: 'Admin', cls: 'violet' },
  agent: { label: 'Mitarbeiter', cls: 'blue' },
};

const AVATAR_TINTS = ['a1', 'a2', 'a3', 'a4', 'a5'];
const tintFor = (str = '') =>
  AVATAR_TINTS[[...str].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TINTS.length];

const relativeTime = (d) => {
  if (!d) return 'noch nie';
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs} Std`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  return new Date(d).toLocaleDateString('de-DE', { dateStyle: 'medium' });
};

const Users = () => {
  const currentEmail = (localStorage.getItem('hotelflow_user') || '').toLowerCase();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Add-user form
  const [nEmail, setNEmail] = useState('');
  const [nName, setNName] = useState('');
  const [nRole, setNRole] = useState('agent');
  const [nPassword, setNPassword] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Inline password reset
  const [pwId, setPwId] = useState(null);
  const [pwValue, setPwValue] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (e) => {
    e.preventDefault();
    if (!nEmail.trim() || nPassword.length < 8) return;
    setAdding(true);
    setError(null);
    setAdded(false);
    try {
      const created = await userAPI.createUser({
        email: nEmail.trim(),
        name: nName.trim(),
        role: nRole,
        password: nPassword,
      });
      setUsers((prev) => [created, ...prev]);
      setNEmail('');
      setNName('');
      setNRole('agent');
      setNPassword('');
      setAdded(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setAdding(false);
    }
  };

  const patchUser = async (id, updates) => {
    setBusyId(id);
    setError(null);
    try {
      const updated = await userAPI.updateUser(id, updates);
      setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)));
      return true;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = (u, role) => patchUser(u._id, { role });
  const toggleActive = (u) => patchUser(u._id, { active: !u.active });

  const submitPassword = async (id) => {
    if (pwValue.length < 8) return;
    const ok = await patchUser(id, { password: pwValue });
    if (ok) {
      setPwId(null);
      setPwValue('');
    }
  };

  const removeUser = async (u) => {
    if (!window.confirm(`Nutzer „${u.name || u.email}" wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) {
      return;
    }
    setBusyId(u._id);
    setError(null);
    try {
      await userAPI.deleteUser(u._id);
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Team verwalten</h1>
          <p className="page-sub">Lege Zugänge für dein Team an, vergib Rollen und setze Passwörter zurück.</p>
        </div>
      </header>

      {error && <div className="banner-error" role="alert">{error}</div>}

      {/* Add user */}
      <div className="card usr-add-card">
        <div className="card-title"><IconUserPlus size={17} /> Neuen Zugang anlegen</div>
        <form onSubmit={addUser} className="usr-add-form">
          <div className="usr-add-grid">
            <div className="usr-field">
              <label className="field-label" htmlFor="nEmail">E-Mail</label>
              <input
                id="nEmail"
                className="field-input"
                type="email"
                inputMode="email"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={nEmail}
                onChange={(e) => { setNEmail(e.target.value); setAdded(false); }}
                placeholder="name@hotel.de"
              />
            </div>
            <div className="usr-field">
              <label className="field-label" htmlFor="nName">Name</label>
              <input
                id="nName"
                className="field-input"
                type="text"
                autoComplete="off"
                value={nName}
                onChange={(e) => setNName(e.target.value)}
                placeholder="Vor- und Nachname"
              />
            </div>
            <div className="usr-field usr-field-role">
              <label className="field-label" htmlFor="nRole">Rolle</label>
              <select id="nRole" className="field-select" value={nRole} onChange={(e) => setNRole(e.target.value)}>
                <option value="agent">Mitarbeiter</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="usr-field">
              <label className="field-label" htmlFor="nPassword">Passwort</label>
              <input
                id="nPassword"
                className="field-input"
                type="text"
                autoComplete="new-password"
                spellCheck={false}
                autoCapitalize="none"
                value={nPassword}
                onChange={(e) => setNPassword(e.target.value)}
                placeholder="mind. 8 Zeichen"
              />
            </div>
          </div>
          <div className="usr-add-actions">
            <button type="submit" className="btn-primary" disabled={adding || !nEmail.trim() || nPassword.length < 8}>
              <IconUserPlus size={15} /> {adding ? 'Anlegen…' : 'Zugang anlegen'}
            </button>
            {added && <span className="set-saved" role="status">Zugang angelegt ✓</span>}
            <span className="usr-hint">Das Passwort teilst du der Person sicher mit — sie kann es behalten oder du setzt es später neu.</span>
          </div>
        </form>
      </div>

      {/* User list */}
      <div className="card usr-list-card">
        <div className="card-title">
          Zugänge <span className="count-badge">{users.length}</span>
        </div>

        {loading ? (
          <div className="settings-loading"><div className="spinner" /></div>
        ) : users.length === 0 ? (
          <p className="notes-empty">Noch keine Zugänge.</p>
        ) : (
          <ul className="usr-list">
            {users.map((u) => {
              const role = ROLE[u.role] || ROLE.agent;
              const isSelf = u.email.toLowerCase() === currentEmail;
              const busy = busyId === u._id;
              return (
                <li key={u._id} className={`usr-row ${!u.active ? 'usr-row-inactive' : ''}`}>
                  <span className={`avatar ${tintFor(u.name || u.email)}`}>
                    {(u.name || u.email).charAt(0).toUpperCase()}
                  </span>

                  <div className="usr-main">
                    <div className="usr-name-line">
                      <span className="usr-name">{u.name || '—'}</span>
                      {isSelf && <span className="usr-you">Du</span>}
                      {!u.active && <span className="usr-inactive-tag">Deaktiviert</span>}
                    </div>
                    <div className="usr-email">{u.email}</div>
                  </div>

                  <div className="usr-meta">
                    <span className="usr-lastlogin" title="Letzte Anmeldung">
                      {relativeTime(u.lastLoginAt)}
                    </span>
                  </div>

                  <div className="usr-role-wrap">
                    {isSelf ? (
                      <span className={`pill tint-${role.cls}`}><IconShield size={12} />{role.label}</span>
                    ) : (
                      <select
                        className={`field-select usr-role-select tint-${role.cls}`}
                        value={u.role}
                        disabled={busy}
                        onChange={(e) => changeRole(u, e.target.value)}
                        aria-label={`Rolle von ${u.name || u.email}`}
                      >
                        <option value="agent">Mitarbeiter</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </div>

                  <div className="usr-actions">
                    <button
                      type="button"
                      className="usr-icon-btn"
                      onClick={() => { setPwId(pwId === u._id ? null : u._id); setPwValue(''); }}
                      title="Passwort zurücksetzen"
                      aria-label={`Passwort von ${u.name || u.email} zurücksetzen`}
                    >
                      <IconKey size={16} />
                    </button>
                    {!isSelf && (
                      <button
                        type="button"
                        className="usr-icon-btn"
                        onClick={() => toggleActive(u)}
                        disabled={busy}
                        aria-pressed={u.active}
                        title={u.active ? 'Aktiv – zum Deaktivieren klicken' : 'Deaktiviert – zum Aktivieren klicken'}
                        aria-label={`${u.name || u.email} ist ${u.active ? 'aktiv' : 'deaktiviert'} – ${u.active ? 'deaktivieren' : 'aktivieren'}`}
                      >
                        {u.active ? <span className="usr-toggle usr-toggle-on" /> : <span className="usr-toggle" />}
                      </button>
                    )}
                    {!isSelf && (
                      <button
                        type="button"
                        className="rule-delete"
                        onClick={() => removeUser(u)}
                        disabled={busy}
                        title="Zugang löschen"
                        aria-label={`${u.name || u.email} löschen`}
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>

                  {pwId === u._id && (
                    <form
                      className="usr-pw-row"
                      onSubmit={(e) => { e.preventDefault(); submitPassword(u._id); }}
                    >
                      <input
                        className="field-input"
                        type="text"
                        autoComplete="new-password"
                        spellCheck={false}
                        autoCapitalize="none"
                        value={pwValue}
                        onChange={(e) => setPwValue(e.target.value)}
                        placeholder="Neues Passwort (mind. 8 Zeichen)"
                        aria-label="Neues Passwort"
                        autoFocus
                      />
                      <button type="submit" className="btn-primary" disabled={busy || pwValue.length < 8}>
                        <IconCheck size={15} /> Speichern
                      </button>
                      <button type="button" className="btn-ghost" onClick={() => { setPwId(null); setPwValue(''); }}>
                        Abbrechen
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Users;
