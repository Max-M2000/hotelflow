const { google } = require('googleapis');

const createGmailClient = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'http://localhost:3001/auth/callback' // Will implement later
  );

  return google.gmail({ version: 'v1', auth: oauth2Client });
};

module.exports = { createGmailClient };
