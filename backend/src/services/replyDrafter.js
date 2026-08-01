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
 * @param {Object} ticket - { guestName, subject, body, category, sentiment }
 * @returns {String} the suggested reply text (no signature)
 */
const draftReply = async ({ guestName, subject, body, category, sentiment }) => {
  const client = getOpenAIClient();

  const prompt = `Du bist Mitarbeiter:in an der Rezeption eines Hotels und schreibst eine freundliche, professionelle Antwort auf die E-Mail eines Gastes. Schreibe auf Deutsch, in der Sie-Form.

E-Mail des Gastes:
Name: ${guestName || 'unbekannt'}
Betreff: ${subject || '(kein Betreff)'}
Nachricht: ${body || ''}

Einordnung (nur Hilfestellung): Kategorie ${category || 'unbekannt'}, Stimmung ${sentiment || 'neutral'}.

Regeln:
- Begrüße den Gast passend (z. B. "Guten Tag Herr/Frau [Nachname]"). Ist der Name unklar, schreibe nur "Guten Tag".
- Gehe konkret und hilfsbereit auf das Anliegen ein. Bei einer Beschwerde: Verständnis zeigen und einen nächsten Schritt oder eine Lösung anbieten.
- SEHR WICHTIG: Erfinde KEINE Fakten, die du nicht kennst (Preise, Verfügbarkeiten, Uhrzeiten, Zimmernummern, Hausregeln). Wo eine konkrete Angabe nötig ist, setze einen klar erkennbaren Platzhalter in eckigen Klammern, z. B. [Check-in-Zeit] oder [Preis], den ein Mensch noch ausfüllt. Behaupte nichts als Tatsache, was nicht in der Gästenachricht steht.
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
