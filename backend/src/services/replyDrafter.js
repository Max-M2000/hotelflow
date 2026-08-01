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

/**
 * Generate a suggested German reply to a guest email.
 *
 * The draft is a STARTING POINT that a human reviews, edits and sends —
 * it is never sent automatically. The prompt is deliberately strict about
 * not inventing facts (prices, times, availability): where a concrete detail
 * is needed it must leave a clearly marked [placeholder] for staff to fill.
 *
 * @param {Object} ticket - { guestName, subject, body, category, sentiment, houseInfo }
 * @returns {String} the suggested reply text (no signature)
 */
const draftReply = async ({ guestName, subject, body, category, sentiment, houseInfo }) => {
  const client = getOpenAIClient();

  const facts = (houseInfo || '').trim();
  const factsBlock = facts
    ? `\nBestätigte Hotel-Infos (nutze diese, wo sie zur Frage passen, und formuliere sie natürlich aus):\n"""\n${facts}\n"""\n`
    : '';

  const prompt = `Du bist Mitarbeiter:in an der Rezeption eines Hotels und schreibst eine freundliche, professionelle Antwort auf die E-Mail eines Gastes. Schreibe auf Deutsch, in der Sie-Form.

E-Mail des Gastes:
Name: ${guestName || 'unbekannt'}
Betreff: ${subject || '(kein Betreff)'}
Nachricht: ${body || ''}

Einordnung (nur Hilfestellung): Kategorie ${category || 'unbekannt'}, Stimmung ${sentiment || 'neutral'}.
${factsBlock}
Regeln:
- Begrüße den Gast passend (z. B. "Guten Tag Herr/Frau [Nachname]"). Ist der Name unklar, schreibe nur "Guten Tag".
- Gehe konkret und hilfsbereit auf das Anliegen ein. Bei einer Beschwerde: Verständnis zeigen und einen nächsten Schritt oder eine Lösung anbieten.
- Wenn die Antwort in den bestätigten Hotel-Infos steht, nutze diese echten Angaben (z. B. die konkrete Check-in-Zeit).
- SEHR WICHTIG – nichts erfinden: Bestätige NIEMALS, dass das Hotel eine Leistung, Ausstattung oder Regelung anbietet oder hat, wenn das nicht ausdrücklich in den bestätigten Hotel-Infos oder in der Gästenachricht steht. Antworte NIE mit "Ja, wir bieten X an", wenn X dort nicht steht.
- Fragt der Gast nach etwas, das nicht hinterlegt ist (z. B. Flughafen-Transfer, Pool, Late Check-out, ein bestimmter Preis oder eine Uhrzeit), dann behaupte weder Ja noch Nein. Formuliere offen und setze einen Platzhalter, den ein Mensch ausfüllt, z. B.: "Zu einem Flughafen-Transfer gebe ich Ihnen gern gesondert Bescheid: [Bieten wir einen Transfer an, und zu welchem Preis?]".
- Erfinde generell keine Fakten (Preise, Verfügbarkeiten, Uhrzeiten, Zimmernummern, Ausstattung, Hausregeln). Im Zweifel lieber einen Platzhalter setzen als etwas annehmen.
- Halte die Antwort kurz und warm (etwa 3 bis 6 Sätze).
- Schließe mit "Mit freundlichen Grüßen" in einer eigenen Zeile. Füge KEINEN Namen und KEINE Signatur an – das ergänzt der Mitarbeiter selbst.
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
