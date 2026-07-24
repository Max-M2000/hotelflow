const { normalizeInboundEmail, parseAddress, makeEmailId } = require('../services/inboundParser');

describe('parseAddress', () => {
  test('extracts name and address from "Name <email>"', () => {
    expect(parseAddress('Anna Kowalski <anna@example.com>')).toEqual({
      name: 'Anna Kowalski',
      address: 'anna@example.com',
    });
  });

  test('handles bare address', () => {
    expect(parseAddress('anna@example.com')).toEqual({ name: '', address: 'anna@example.com' });
  });

  test('lowercases the address', () => {
    expect(parseAddress('Anna@Example.COM').address).toBe('anna@example.com');
  });
});

describe('normalizeInboundEmail', () => {
  test('Postmark JSON', async () => {
    const out = await normalizeInboundEmail({
      FromFull: { Email: 'guest@hotel-test.de', Name: 'Max Gast' },
      Subject: 'Frage zur Buchung',
      TextBody: 'Ab wann kann ich einchecken?',
      MessageID: 'pm-123',
    });
    expect(out).toMatchObject({
      from: 'guest@hotel-test.de',
      fromName: 'Max Gast',
      subject: 'Frage zur Buchung',
      text: 'Ab wann kann ich einchecken?',
      emailId: 'pm-123',
    });
  });

  test('Mailgun form fields', async () => {
    const out = await normalizeInboundEmail({
      sender: 'beschwerde@gmail.com',
      subject: 'Zimmer zu laut',
      'body-plain': 'Die Klimaanlage ist sehr laut.',
      'Message-Id': 'mg-9',
    });
    expect(out.from).toBe('beschwerde@gmail.com');
    expect(out.text).toBe('Die Klimaanlage ist sehr laut.');
    expect(out.emailId).toBe('mg-9');
  });

  test('CloudMailin JSON (headers + plain + envelope)', async () => {
    const out = await normalizeInboundEmail({
      envelope: { from: 'gast@web.de', to: 'hotel@cloudmailin.net' },
      headers: { From: 'Gast Mueller <gast@web.de>', Subject: 'Spätes Einchecken', 'Message-ID': 'cm-42' },
      plain: 'Kann ich um 23 Uhr einchecken?',
    });
    expect(out.from).toBe('gast@web.de');
    expect(out.fromName).toBe('Gast Mueller');
    expect(out.subject).toBe('Spätes Einchecken');
    expect(out.text).toContain('23 Uhr');
    expect(out.emailId).toBe('cm-42');
  });

  test('strips HTML from an HTML-only body', async () => {
    const out = await normalizeInboundEmail({
      from: 'gast@web.de',
      subject: 'Frage',
      html: "<html><body><div style=\"font-size:12px\">Hallo, <b>ist</b> Frühstück inklusive?</div></body></html>",
    });
    expect(out.text).not.toMatch(/<[^>]+>/);
    expect(out.text).toContain('Frühstück inklusive');
  });

  test('Generic / manual test payload', async () => {
    const out = await normalizeInboundEmail({
      from: 'Lisa <lisa@web.de>',
      subject: 'Parkplatz',
      text: 'Gibt es Parkplätze am Hotel?',
    });
    expect(out.from).toBe('lisa@web.de');
    expect(out.fromName).toBe('Lisa');
    // No message id provided → deterministic hash id
    expect(out.emailId.startsWith('sha:')).toBe(true);
  });

  test('same content produces same deterministic id (dedup)', async () => {
    const payload = { from: 'a@b.de', subject: 'Hi', text: 'Test' };
    const a = await normalizeInboundEmail(payload);
    const b = await normalizeInboundEmail(payload);
    expect(a.emailId).toBe(b.emailId);
  });

  test('returns null when address or body missing', async () => {
    expect(await normalizeInboundEmail({ subject: 'x' })).toBeNull();
    expect(await normalizeInboundEmail({ from: 'a@b.de' })).toBeNull();
    expect(await normalizeInboundEmail(null)).toBeNull();
  });

  test('parses raw MIME', async () => {
    const raw = [
      'From: "Tom Test" <tom@test.de>',
      'Subject: Late Checkout',
      'Content-Type: text/plain',
      '',
      'Ist ein spaeter Checkout moeglich?',
    ].join('\n');
    const out = await normalizeInboundEmail({ raw });
    expect(out.from).toBe('tom@test.de');
    expect(out.subject).toBe('Late Checkout');
    expect(out.text).toContain('spaeter Checkout');
  });
});
