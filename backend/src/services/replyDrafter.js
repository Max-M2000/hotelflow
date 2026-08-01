const OpenAI = require('openai');

let openai;

/**
 * Lazy OpenAI client (same pattern as the categorizer).
 */
const getOpenAIClient = () => {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'sk-test-dummy',
    });
  }
  return openai;
};

// Per-hotel tone presets: control salutation, formality and closing.
const STYLE_INSTRUCTIONS = {
  formal:
    'Ton: sachlich und höflich-distanziert, durchgängig Sie. Anrede: Sprich den Gast mit Namen an, wenn im Absender oder in der Nachricht (z. B. Grußzeile) ein Name erkennbar ist – "Sehr geehrter Herr [Nachname]" bzw. "Sehr geehrte Frau [Nachname]"; handelt es sich um eine Familie, "Sehr geehrte Familie [Nachname]". Nur wenn wirklich kein Name erkennbar ist: "Sehr geehrte Damen und Herren".',
  professional:
    'Ton: warm und professionell, Sie. Anrede mit Namen, wenn erkennbar – "Guten Tag Herr/Frau [Nachname]" bzw. bei einer Familie "Guten Tag Familie [Nachname]". Nur ohne erkennbaren Namen: "Guten Tag".',
  casual:
    'Ton: herzlich und persönlich, aber respektvoll, Sie. Anrede locker mit Vornamen, wenn erkennbar – "Hallo [Vorname]"; sonst "Hallo".',
};

/**
 * Generate a suggested German reply to a guest email.
 *
 * The draft is a STARTING POINT that a human reviews, edits and sends —
 * it is never sent automatically. The prompt is deliberately strict about
 * not inventing facts (prices, times, availability, services): where a concrete
 * detail is unknown it must leave a clearly marked [placeholder] for staff.
 *
 * @param {Object} opts - { guestName, subject, body, category, sentiment,
 *                          houseInfo, replyStyle, styleNotes }
 * @returns {String} the suggested reply text (no signature)
 */
const draftReply = async ({
  guestName,
  subject,
  body,
  category,
  sentiment,
  houseInfo,
  replyStyle,
  styleNotes,
}) => {
  const client = getOpenAIClient();

  const facts = (houseInfo || '').trim();
  const factsBlock = facts
    ? `\nBestätigte Hotel-Infos (nutze diese, wo sie zur Frage passen, und formuliere sie natürlich aus):\n"""\n${facts}\n"""\n`
    : '';

  const style = STYLE_INSTRUCTIONS[replyStyle] || STYLE_INSTRUCTIONS.professional;
  const notes = (styleNotes || '').trim();
  const notesBlock = notes
    ? `\nZusätzliche Stil-Wünsche des Hotels (unbedingt beachten): ${notes}\n`
    : '';

  const prompt = `Du bist Mitarbeiter:in an der Rezeption eines Hotels und schreibst eine Antwort auf die E-Mail eines Gastes. Schreibe auf Deutsch.

E-Mail des Gastes:
Name: ${guestName || 'unbekannt'}
Betreff: ${subject || '(kein Betreff)'}
Nachricht: ${body || ''}

Einordnung (nur Hilfestellung): Kategorie ${category || 'unbekannt'}, Stimmung ${sentiment || 'neutral'}.
${factsBlock}
Stil des Hotels (halte dich genau daran): ${style}${notesBlock}
Regeln:
- Halte dich an den vorgegebenen Stil (Anrede, Ton, Grußformel).
- Gehe konkret und hilfsbereit auf das Anliegen ein. Bei einer Beschwerde: Verständnis zeigen und einen nächsten Schritt oder eine Lösung anbieten.
- Wenn die Antwort in den bestätigten Hotel-Infos steht, nutze diese echten Angaben (z. B. die konkrete Check-in-Zeit).
- SEHR WICHTIG – nichts erfinden: Bestätige NIEMALS, dass das Hotel eine Leistung, Ausstattung oder Regelung anbietet oder hat, wenn das nicht ausdrücklich in den bestätigten Hotel-Infos oder in der Gästenachricht steht. Antworte NIE mit "Ja, wir bieten X an", wenn X dort nicht steht.
- Fragt der Gast nach etwas, das nicht hinterlegt ist (z. B. Flughafen-Transfer, Pool, Late Check-out, ein bestimmter Preis oder eine Uhrzeit), dann behaupte weder Ja noch Nein. Formuliere offen und setze einen Platzhalter, den ein Mensch ausfüllt, z. B.: "Zu einem Flughafen-Transfer gebe ich Ihnen gern gesondert Bescheid: [Bieten wir einen Transfer an, und zu welchem Preis?]".
- Erfinde generell keine Fakten (Preise, Verfügbarkeiten, Uhrzeiten, Zimmernummern, Ausstattung, Hausregeln). Im Zweifel lieber einen Platzhalter setzen als etwas annehmen.
- Halte die Antwort kurz (etwa 3 bis 6 Sätze).
- Beende mit dem letzten inhaltlichen Satz. Schreibe KEINE Grußformel (kein "Mit freundlichen Grüßen") und KEINEN Namen – die Signatur wird automatisch angehängt.
- Gib NUR den Antworttext aus: keine Vorbemerkung, kein Betreff, keine Anführungszeichen.`;

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_REPLY_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 500,
  });

  return (response.choices[0].message.content || '').trim();
};

module.exports = { draftReply };
