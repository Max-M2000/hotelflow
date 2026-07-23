const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Use OpenAI to categorize an email
 * @param {String} subject - Email subject
 * @param {String} body - Email body
 * @returns {Object} { category, priority, sentiment }
 */
const categorizeEmail = async (subject, body) => {
  const prompt = `
Analyze this hotel guest email and categorize it:

Subject: ${subject}
Body: ${body}

Respond ONLY with JSON (no markdown, no extra text):
{
  "category": "inquiry|complaint|booking|other",
  "priority": "low|medium|high",
  "sentiment": "positive|neutral|negative"
}

Rules:
- Category "complaint" = negative sentiment
- Category "booking" = usually positive/neutral
- Priority "high" = urgent words like "urgent", "ASAP", complaints
- Priority "low" = general questions
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 100,
    });

    const content = response.choices[0].message.content.trim();
    const result = JSON.parse(content);

    return {
      category: result.category || 'other',
      priority: result.priority || 'medium',
      sentiment: result.sentiment || 'neutral',
    };
  } catch (error) {
    console.error('Categorization failed:', error.message);
    // Fallback to safe defaults if API fails
    return {
      category: 'other',
      priority: 'medium',
      sentiment: 'neutral',
    };
  }
};

module.exports = { categorizeEmail };
