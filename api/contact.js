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

  const html = renderHtml({ firstName, company, email, phone, state });

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

function renderHtml({ firstName, company, email, phone, state }) {
  const oxblood = '#701E28';
  const oxbloodLight = '#f9e8eb';
  const ink = '#18181B';
  const inkSoft = '#404040';
  const inkFaint = '#6a6a6a';
  const line = '#d8d4c8';
  const paperWarm = '#f7f4ee';

  const serif = "'Fraunces', Georgia, 'Times New Roman', serif";
  const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

  const row = (label, value) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid ${line};width:90px;color:${inkFaint};font-size:12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;vertical-align:top;">${label}</td>
      <td style="padding:14px 0;border-bottom:1px solid ${line};color:${ink};font-size:15px;line-height:1.5;">${value}</td>
    </tr>`;

  const emailValue = `<a href="mailto:${escapeHtml(email)}" style="color:${oxblood};text-decoration:none;font-weight:600;">${escapeHtml(email)}</a>`;
  const phoneValue = phone
    ? `<a href="tel:${escapeHtml(phone)}" style="color:${ink};text-decoration:none;">${escapeHtml(phone)}</a>`
    : `<span style="color:${inkFaint};">—</span>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New inquiry — Audacity Apprenticeships</title>
</head>
<body style="margin:0;padding:0;background:${paperWarm};font-family:${sans};color:${ink};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${paperWarm};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid ${line};border-top:4px solid ${oxblood};border-radius:4px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid ${line};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <span style="font-family:${serif};font-weight:600;font-size:28px;color:${oxblood};line-height:1;display:inline-block;vertical-align:middle;margin-right:10px;">A</span>
                    <span style="font-family:${serif};font-weight:600;font-size:18px;color:${ink};letter-spacing:-0.01em;vertical-align:middle;">Audacity <span style="color:${inkFaint};font-weight:500;">Apprenticeships</span></span>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block;background:${oxbloodLight};color:${oxblood};padding:5px 10px;border-radius:3px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">New inquiry</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:${oxblood};">From withaudacity.com</p>
              <h1 style="margin:0 0 8px;font-family:${sans};font-size:24px;font-weight:700;letter-spacing:-0.02em;color:${ink};line-height:1.2;">${escapeHtml(firstName)} from ${escapeHtml(company)}</h1>
              <p style="margin:0 0 28px;font-size:15px;color:${inkSoft};line-height:1.55;">
                Just submitted the contact form. Reply to this email to respond directly.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${line};">
                ${row('Name', `<strong style="font-weight:600;">${escapeHtml(firstName)}</strong>`)}
                ${row('Company', `<strong style="font-weight:600;">${escapeHtml(company)}</strong>`)}
                ${row('Email', emailValue)}
                ${row('Phone', phoneValue)}
                ${row('State', escapeHtml(state))}
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
                <tr>
                  <td style="background:${oxblood};border-radius:4px;">
                    <a href="mailto:${escapeHtml(email)}?subject=${encodeURIComponent(`Re: Audacity Apprenticeships — ${company}`)}" style="display:inline-block;padding:12px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;font-family:${sans};">
                      Reply to ${escapeHtml(firstName)} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px;background:${paperWarm};border-top:1px solid ${line};font-size:12px;color:${inkFaint};line-height:1.5;">
              Sent from the contact form at <a href="https://withaudacity.com" style="color:${inkFaint};text-decoration:underline;">withaudacity.com</a>. Reply-to is set to the visitor's email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
