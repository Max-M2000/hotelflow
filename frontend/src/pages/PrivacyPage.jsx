import React from 'react';
import { Link } from 'react-router-dom';
import { IconLogo } from '../components/Icons';
import '../styles/privacy.css';

// Öffentliche Datenschutz- & KI-Info für app.ospitara.de.
// Die Marketing-Website (ospitara.de/datenschutz) verweist auf diese Seite.
const PrivacyPage = () => {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <Link to="/login" className="privacy-back">← Zurück zur Anmeldung</Link>

        <div className="privacy-brand">
          <IconLogo size={26} />
          <span translate="no">Ospitara</span>
        </div>

        <h1>Datenschutz &amp; Einsatz von KI</h1>
        <p className="privacy-muted">Stand: August 2026</p>

        <h2>Rollenverteilung (DSGVO)</h2>
        <p>
          Ospitara verarbeitet Gästedaten ausschließlich im Auftrag und nach Weisung Ihres Hotels.
          <strong> Verantwortlicher</strong> im Sinne der DSGVO ist Ihr Hotel;
          <strong> Ospitara (Max Mundt)</strong> wird als <strong>Auftragsverarbeiter</strong> auf
          Grundlage eines Auftragsverarbeitungsvertrags (Art. 28 DSGVO) tätig.
        </p>

        <h2>Welche Daten verarbeitet werden</h2>
        <p>
          Inhalte eingehender Gästemails (Name, E-Mail-Adresse, Betreff, Nachricht, Zeitstempel),
          daraus abgeleitete Merkmale (Kategorie, Priorität, Stimmung) sowie Bearbeitungsdaten Ihres
          Teams (Status, Zuordnung, Notizen) und Ihre Nutzerkonten.
        </p>

        <h2>Einsatz von Künstlicher Intelligenz</h2>
        <ul>
          <li>
            Zur Kategorisierung von Nachrichten und zur Erstellung von Antwort-<em>Entwürfen</em>
            setzen wir KI-Dienste ein, unter anderem von OpenAI (USA). Dabei werden Nachrichteninhalte
            verarbeitet und können in ein Drittland (USA) übermittelt werden – auf Grundlage der
            EU-Standardvertragsklauseln und ergänzender Schutzmaßnahmen.
          </li>
          <li>
            Über die OpenAI-API übermittelte Daten werden nach Angaben des Anbieters
            <strong> nicht zum Training</strong> der Modelle verwendet.
          </li>
          <li>
            <strong>Keine automatisierte Versendung, keine automatisierte Entscheidung (Art. 22 DSGVO):</strong>
            Die KI erstellt ausschließlich Vorschläge. Jede Antwort wird von einem Menschen geprüft und
            manuell versendet.
          </li>
        </ul>

        <h2>Sicherheit (technische &amp; organisatorische Maßnahmen)</h2>
        <p>
          Zugriff nur über persönliches Login (Passwörter nur als Hash), Rollenkonzept
          (Administrator/Mitarbeiter), verschlüsselte Übertragung (TLS/HTTPS), Betrieb bei etablierten
          Cloud-Anbietern mit regelmäßiger Sicherung. Details in Anlage 1 des Auftragsverarbeitungsvertrags.
        </p>

        <h2>Eingesetzte Dienstleister (Unterauftragsverarbeiter)</h2>
        <p>
          OpenAI (KI), Railway (Anwendung), MongoDB Atlas (Datenbank, EU-Region), AWS SES (Mailversand, EU),
          CloudMailin (Mailempfang, EU/UK), Vercel (Website), Zoho (Postfach, EU). Die jeweils aktuelle
          Liste stellen wir auf Anfrage bereit.
        </p>

        <h2>Betroffenenrechte</h2>
        <p>
          Anfragen betroffener Gäste (Auskunft, Berichtigung, Löschung usw.) richten sich an das
          verantwortliche Hotel. Ospitara unterstützt das Hotel bei der Erfüllung dieser Rechte.
        </p>

        <h2>Kontakt</h2>
        <p>
          Max Mundt (Ospitara), Septimerstraße 38, 13407 Berlin<br />
          <a href="mailto:info@ospitara.de">info@ospitara.de</a>
        </p>

        <p className="privacy-muted privacy-footnote">
          Diese Informationen ergänzen die Datenschutzerklärung der Website
          {' '}<a href="https://ospitara.de/datenschutz.html" target="_blank" rel="noreferrer">ospitara.de</a>
          {' '}und den Auftragsverarbeitungsvertrag mit Ihrem Hotel.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPage;
