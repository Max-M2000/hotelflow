const OpenAI = require('openai');

let openai;

/**
 * Get or create OpenAI instance (lazy loading)
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
 * Use OpenAI to categorize an email AND extract the guest's real name.
 *
 * The name is read from how the guest actually signs the message (signature /
 * "Viele Grüße, ..." line) or the sender header — NOT guessed from the email
 * address. This prevents salutations like "Sehr geehrter Herr test" when the
 * address is test.hotelflow@… but the person signs as "Max Mustermann".
 *
 * @param {String} subject - Email subject
 * @param {String} body - Email body
 * @param {Object} [meta] - { fromName, fromEmail } from the email header
 * @returns {Object} { category, priority, sentiment, guestName }
 *   guestName is '' when no real personal name can be determined.
 */
const categorizeEmail = async (subject, body, meta = {}) => {
  const client = getOpenAIClient();
  const fromName = (meta.fromName || '').trim();
  const fromEmail = (meta.fromEmail || '').trim();
  const prompt = `
Analyze this hotel guest email: categorize it and extract the guest's real name.

Sender name (from header, may be empty or generic): ${fromName || '(none)'}
Sender email: ${fromEmail || '(unknown)'}
Subject: ${subject}
Body: ${body}

Respond ONLY with JSON (no markdown, no extra text):
{
  "category": "inquiry|complaint|booking|other",
  "priority": "low|medium|high",
  "sentiment": "positive|neutral|negative",
  "guestName": "the guest's real name, or empty string"
}

Rules:
- Category "complaint" = negative sentiment
- Category "booking" = usually positive/neutral
- Priority "high" = urgent words like "urgent", "ASAP", complaints
- Priority "low" = general questions
- guestName: use the name the guest signs the message with (e.g. a signature or a
  "Viele Grüße, Max Mustermann" line). If none is in the text, use the sender name
  IF it looks like a real personal name (e.g. "Anna Weber", "Familie Schmidt").
  Prefer the fullest form (first + last name). Do NOT derive a name from the email
  address, and do NOT invent one. If no real name is available, return "".
`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 150,
    });

    const content = response.choices[0].message.content.trim();
    const result = JSON.parse(content);

    return {
      category: result.category || 'other',
      priority: result.priority || 'medium',
      sentiment: result.sentiment || 'neutral',
      guestName: (result.guestName || '').trim(),
    };
  } catch (error) {
    console.error('Categorization failed:', error.message);
    // Fallback to safe defaults if API fails
    return {
      category: 'other',
      priority: 'medium',
      sentiment: 'neutral',
      guestName: '',
    };
  }
};

module.exports = { categorizeEmail };
