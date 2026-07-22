const { simpleParser } = require('mailparser');

/**
 * Parse raw email data and extract key fields
 * @param {Buffer} emailBuffer - Raw email data
 * @returns {Object} Parsed email with { from, to, subject, text, html }
 */
const parseEmailBuffer = async (emailBuffer) => {
  try {
    const parsed = await simpleParser(emailBuffer);
    return {
      from: parsed.from.text,
      to: parsed.to ? parsed.to.text : 'unknown',
      subject: parsed.subject || '(no subject)',
      text: parsed.text || '',
      html: parsed.html || '',
    };
  } catch (error) {
    console.error('Email parsing failed:', error);
    throw new Error('Could not parse email');
  }
};

/**
 * Extract guest name from email address
 * @param {String} email - Email address
 * @returns {String} Guest name
 */
const extractGuestName = (email) => {
  const namePart = email.split('@')[0];
  return namePart.replace(/[._-]/g, ' ').trim();
};

module.exports = { parseEmailBuffer, extractGuestName };
