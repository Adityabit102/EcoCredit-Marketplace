const env = require('../config/env');
const logger = require('../config/logger');

// Sends transactional email via Resend when configured; otherwise no-ops (dev-safe).
// Activates automatically once RESEND_API_KEY is set — no code changes needed.
async function sendEmail({ to, subject, html }) {
  if (!env.resendApiKey) {
    logger.debug({ to, subject }, 'Email skipped (RESEND_API_KEY not set)');
    return { sent: false, reason: 'not_configured' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.mailFrom, to, subject, html }),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, 'Resend email failed');
      return { sent: false, reason: 'provider_error' };
    }
    return { sent: true };
  } catch (err) {
    logger.warn({ err: err.message }, 'Email send error');
    return { sent: false, reason: 'exception' };
  }
}

const wrap = (title, body) => `
  <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;border:1px solid #E7D7C8;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#3E5F55,#6FA690);padding:24px;color:#FDFBF6">
      <h1 style="margin:0;font-size:20px">🌿 ${env.appName}</h1>
    </div>
    <div style="padding:24px;color:#2C453E">
      <h2 style="margin-top:0">${title}</h2>${body}
    </div>
  </div>`;

module.exports = { sendEmail, wrap };
