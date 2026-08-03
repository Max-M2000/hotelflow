import React, { useState, useEffect } from 'react';
import { setupAPI } from '../services/api';
import { IconInbox, IconCheck, IconRefresh, IconClock, IconArrowRight } from './Icons';
import '../styles/dashboard.css';
import '../styles/detail.css';
import '../styles/setup.css';

const PROVIDERS = [
  {
    id: 'ionos',
    name: 'IONOS',
    steps: [
      'Im IONOS-Konto anmelden und den Bereich „E-Mail“ öffnen.',
      'Ihre Gäste-Adresse auswählen und „Weiterleitung“ anklicken.',
      'Die Ospitara-Adresse als Ziel eintragen.',
      'Option „Kopie behalten“ aktivieren und speichern.',
    ],
  },
  {
    id: 'strato',
    name: 'STRATO',
    steps: [
      'Im STRATO-Login die „E-Mail-Verwaltung“ öffnen.',
      'Das Postfach auswählen und zu „Einstellungen / Weiterleitung“ gehen.',
      'Die Ospitara-Adresse eintragen.',
      '„Kopie behalten“ aktivieren und speichern.',
    ],
  },
  {
    id: 'microsoft',
    name: 'Microsoft 365',
    steps: [
      'Outlook im Browser öffnen, dann Einstellungen → E-Mail → Weiterleitung.',
      'Weiterleitung aktivieren und die Ospitara-Adresse eintragen.',
      '„Kopie der Nachrichten behalten“ anhaken und speichern.',
      'Bei einem gemeinsamen Postfach richtet das der Administrator im Admin-Center ein.',
    ],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    steps: [
      'In Gmail: Einstellungen → „Weiterleitung und POP/IMAP“.',
      '„Weiterleitungsadresse hinzufügen“ und die Ospitara-Adresse eintragen.',
      'Google schickt einen Bestätigungscode an die Ospitara-Adresse. Diesen Schritt machen wir gemeinsam.',
      'Danach „Kopie im Posteingang behalten“ wählen und speichern.',
    ],
  },
  {
    id: 'andere',
    name: 'Anderer Anbieter',
    steps: [
      'In den E-Mail-Einstellungen den Bereich „Filter“ oder „Weiterleitung“ öffnen.',
      'Eine Regel anlegen: alle Nachrichten weiterleiten an die Ospitara-Adresse.',
      '„Kopie behalten“ aktivieren und speichern.',
      'Unsicher? Schreiben Sie an info@ospitara.de – wir richten es gemeinsam ein.',
    ],
  },
];

const relativeTime = (iso) => {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'gerade eben';
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  return `vor ${d} Tag${d > 1 ? 'en' : ''}`;
};

const EmailSetup = () => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [provider, setProvider] = useState('ionos');

  const load = async () => {
    try {
      setLoading(true);
      const data = await setupAPI.info();
      setInfo(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const address = info?.forwardingAddress || null;

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const connected = !!info?.lastEmailAt;
  const active = PROVIDERS.find((p) => p.id === provider);

  return (
    <div className="page">
      <div className="detail-head">
        <h1 className="detail-title">Einrichtung</h1>
        <p className="settings-subtitle">
          Leiten Sie Ihren Gäste-Posteingang an Ospitara weiter. Wenige Minuten, kein Passwort nötig,
          und an Ihrer gewohnten Adresse ändert sich nichts.
        </p>
        {info?.hotelName && (
          <p className="settings-subtitle" style={{ marginTop: 4, opacity: 0.75 }}>
            Workspace: <strong>{info.hotelName}</strong>
          </p>
        )}
      </div>

      {error && <div className="banner-error" role="alert">{error}</div>}

      {loading ? (
        <div className="settings-loading"><div className="spinner" /></div>
      ) : (
        <div className="setup-stack">
          {/* Status */}
          <div className={`setup-status ${connected ? 'setup-status-ok' : 'setup-status-wait'}`}>
            <div className="setup-status-icon" aria-hidden="true">
              {connected ? <IconCheck size={20} /> : <IconClock size={20} />}
            </div>
            <div className="setup-status-text">
              <div className="setup-status-title">
                {connected ? 'Weiterleitung aktiv' : 'Noch keine Mail empfangen'}
              </div>
              <div className="setup-status-sub">
                {connected
                  ? `Zuletzt empfangen ${relativeTime(info.lastEmailAt)} · ${info.totalTickets} Ticket${info.totalTickets === 1 ? '' : 's'} gesamt`
                  : 'Richten Sie unten die Weiterleitung ein und schicken Sie eine Test-Mail.'}
              </div>
            </div>
            <button className="btn-secondary setup-refresh" onClick={load} title="Status aktualisieren">
              <IconRefresh size={15} /> Aktualisieren
            </button>
          </div>

          {/* Forwarding address */}
          <div className="card setup-card">
            <div className="card-title">Ihre Ospitara-Adresse</div>
            <p className="set-hint">Diese Adresse tragen Sie bei Ihrem E-Mail-Anbieter als Weiterleitungs-Ziel ein.</p>
            {address ? (
              <div className="setup-address">
                <code className="setup-address-value">{address}</code>
                <button className="btn-primary setup-copy" onClick={copyAddress}>
                  {copied ? <><IconCheck size={15} /> Kopiert</> : 'Kopieren'}
                </button>
              </div>
            ) : (
              <div className="setup-address setup-address-empty">
                <span>Adresse wird noch eingerichtet. Ihr Ansprechpartner meldet sich – oder schreiben Sie an info@ospitara.de.</span>
              </div>
            )}
          </div>

          {/* Provider guide */}
          <div className="card setup-card">
            <div className="card-title">Anleitung nach Anbieter</div>
            <div className="setup-tabs" role="tablist" aria-label="E-Mail-Anbieter">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={provider === p.id}
                  className={`setup-tab ${provider === p.id ? 'setup-tab-active' : ''}`}
                  onClick={() => setProvider(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <ol className="setup-steps">
              {active.steps.map((step, i) => (
                <li key={i} className="setup-step">
                  <span className="setup-step-num">{i + 1}</span>
                  <span className="setup-step-text">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Test hint */}
          <div className="setup-testhint">
            <IconArrowRight size={16} />
            <span>
              Fertig? Schicken Sie eine kurze Test-Mail an Ihre Gäste-Adresse und klicken Sie oben auf
              „Aktualisieren“. Erscheint sie unter <strong>Tickets</strong>, läuft alles.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSetup;
