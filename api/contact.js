export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, company, email, phone, state } = req.body || {};

  if (!firstName || !company || !email || !state) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const subject = `New inquiry — ${company} (${state})`;
  const text = `New inquiry from withaudacity.com:

Name: ${firstName}
Company: ${company}
Email: ${email}
Phone: ${phone || '—'}
State: ${state}`;

  const html = `
    <h2 style="margin:0 0 16px;font-family:system-ui,sans-serif;">New inquiry from withaudacity.com</h2>
    <table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px;">
      <tr><td style="padding:6px 12px 6px 0;color:#666;">Name</td><td style="padding:6px 0;"><strong>${escapeHtml(firstName)}</strong></td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#666;">Company</td><td style="padding:6px 0;"><strong>${escapeHtml(company)}</strong></td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#666;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#666;">Phone</td><td style="padding:6px 0;">${escapeHtml(phone || '—')}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#666;">State</td><td style="padding:6px 0;">${escapeHtml(state)}</td></tr>
    </table>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Audacity Apprenticeships <noreply@withaudacity.com>',
        to: ['rachel@withaudacity.com'],
        reply_to: email,
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Resend error', response.status, errBody);
      return res.status(502).json({ error: 'Email delivery failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Handler error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
