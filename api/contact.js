// Vercel Serverless Function - Contact Form Handler
// Sends email via Resend to candice@agilecounseling.com

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://agilecounseling.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, phone, concern, ageGroup, preferredContact, message } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Build email content
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1c3d5a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🔔 New Appointment Request</h1>
        <p style="margin: 8px 0 0; opacity: 0.9;">Agile Counseling Contact Form</p>
      </div>
      
      <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 140px;">Name:</td>
            <td style="padding: 8px 0;">${firstName} ${lastName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
            <td style="padding: 8px 0;"><a href="tel:${phone}">${phone}</a></td>
          </tr>
          ${concern ? `<tr><td style="padding: 8px 0; font-weight: bold;">Concern:</td><td style="padding: 8px 0;">${concern}</td></tr>` : ''}
          ${ageGroup ? `<tr><td style="padding: 8px 0; font-weight: bold;">Client Type:</td><td style="padding: 8px 0;">${ageGroup}</td></tr>` : ''}
          ${preferredContact ? `<tr><td style="padding: 8px 0; font-weight: bold;">Preferred Contact:</td><td style="padding: 8px 0;">${preferredContact}</td></tr>` : ''}
        </table>
        
        ${message ? `
          <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 6px; border-left: 4px solid #4a90c4;">
            <p style="margin: 0 0 8px; font-weight: bold; color: #374151;">Message:</p>
            <p style="margin: 0; color: #4b5563; white-space: pre-wrap;">${message}</p>
          </div>
        ` : ''}
      </div>
      
      <div style="padding: 16px; background: #1c3d5a; color: white; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px;">
        Submitted via agilecounseling.com | ${new Date().toLocaleString('en-US', { timeZone: 'America/Denver' })}
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Agile Counseling <leads@gullstack.com>',
        to: ['candice@agilecounseling.com'],
        reply_to: email,
        subject: `New Appointment Request: ${firstName} ${lastName}${concern ? ` - ${concern}` : ''}`,
        html: emailHtml,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend error:', result);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true, message: 'Thank you! We will contact you within 24 hours.' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
