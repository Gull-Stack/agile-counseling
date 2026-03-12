// Vercel Serverless Function - Contact Form Handler
// Sends email via SendGrid to candice@agilecounseling.com

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SITE_EMAIL = process.env.SITE_EMAIL || 'candice@agilecounseling.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'leads@gullstack.com';

// === SPAM PROTECTION ===
function isGibberish(text) {
  if (!text || text.length < 2) return false;
  const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length < 2) return false;
  const vowels = cleaned.match(/[aeiou]/g);
  if (!vowels || vowels.length < cleaned.length * 0.15) return true;
  if (/[^aeiou]{5,}/i.test(cleaned)) return true;
  return false;
}

function looksLikeSpam(data) {
  const { firstName, lastName, fax_number, _timestamp } = data;
  if (fax_number) return 'honeypot';
  if (_timestamp) {
    const elapsed = Date.now() - parseInt(_timestamp, 10);
    if (elapsed < 3000) return 'too_fast';
  }
  if (isGibberish(firstName) || isGibberish(lastName)) return 'gibberish_name';
  if ((firstName && firstName.trim().length < 2) || (lastName && lastName.trim().length < 2)) return 'short_name';
  return false;
}
// === END SPAM PROTECTION ===

async function sendEmail({ to, from, fromName, subject, html, replyTo, cc }) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], ...(cc ? { cc: [{ email: cc }] } : {}) }],
      from: { email: from, name: fromName || 'Agile Counseling' },
      reply_to: replyTo ? { email: replyTo } : undefined,
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  return response.ok;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://agilecounseling.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, lastName, email, phone, concern, ageGroup, preferredContact, message, fax_number, _timestamp } = req.body;

  // === SPAM CHECK ===
  const spamReason = looksLikeSpam({ firstName, lastName, fax_number, _timestamp });
  if (spamReason) {
    console.log(`[SPAM BLOCKED] reason=${spamReason} name="${firstName} ${lastName}" email="${email}"`);
    return res.status(200).json({ success: true, message: 'Thank you! We will contact you within 24 hours.' });
  }
  // === END SPAM CHECK ===

  if (!firstName || !lastName || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1c3d5a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🔔 New Appointment Request</h1>
        <p style="margin: 8px 0 0; opacity: 0.9;">Agile Counseling Contact Form</p>
      </div>
      <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold; width: 140px;">Name:</td><td style="padding: 8px 0;">${firstName} ${lastName}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Phone:</td><td style="padding: 8px 0;"><a href="tel:${phone}">${phone}</a></td></tr>
          ${concern ? `<tr><td style="padding: 8px 0; font-weight: bold;">Concern:</td><td style="padding: 8px 0;">${concern}</td></tr>` : ''}
          ${ageGroup ? `<tr><td style="padding: 8px 0; font-weight: bold;">Client Type:</td><td style="padding: 8px 0;">${ageGroup}</td></tr>` : ''}
          ${preferredContact ? `<tr><td style="padding: 8px 0; font-weight: bold;">Preferred Contact:</td><td style="padding: 8px 0;">${preferredContact}</td></tr>` : ''}
        </table>
        ${message ? `<div style="margin-top: 16px; padding: 16px; background: white; border-radius: 6px; border-left: 4px solid #4a90c4;"><p style="margin: 0 0 8px; font-weight: bold; color: #374151;">Message:</p><p style="margin: 0; color: #4b5563; white-space: pre-wrap;">${message}</p></div>` : ''}
      </div>
      <div style="padding: 16px; background: #1c3d5a; color: white; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px;">
        Submitted via agilecounseling.com | ${new Date().toLocaleString('en-US', { timeZone: 'America/Denver' })}
      </div>
    </div>
  `;

  try {
    // Send notification to Candice
    const sent = await sendEmail({
      to: SITE_EMAIL,
      from: FROM_EMAIL,
      fromName: `${firstName} ${lastName} via Agile Counseling`,
      subject: `New Appointment Request: ${firstName} ${lastName}${concern ? ` - ${concern}` : ''}`,
      html: emailHtml,
      replyTo: email,
      cc: 'bryce@gullstack.com',
    });

    if (!sent) {
      console.error('SendGrid delivery failed');
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true, message: 'Thank you! We will contact you within 24 hours.' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
