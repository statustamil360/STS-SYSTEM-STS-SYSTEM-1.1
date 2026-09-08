const nodemailer = require('nodemailer');
const { getSettingObject } = require('./settingsService');

const DEFAULT_SMTP = {
  enabled: false,
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  smtp_password: '',
  from_email: '',
  use_tls: true,
};

const sendMail = async ({ to, subject, text, html, attachments = [] }) => {
  if (!to) return { sent: false, reason: 'missing_recipient' };

  const smtp = await getSettingObject('email_settings', DEFAULT_SMTP);
  if (!smtp.enabled || !smtp.smtp_host || !smtp.from_email) {
    console.warn('[email] SMTP is not configured — notification skipped:', subject);
    return { sent: false, reason: 'smtp_disabled' };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.smtp_host,
    port: Number(smtp.smtp_port) || 587,
    secure: Number(smtp.smtp_port) === 465,
    auth: smtp.smtp_user ? { user: smtp.smtp_user, pass: smtp.smtp_password } : undefined,
    tls: smtp.use_tls === false ? { rejectUnauthorized: false } : undefined,
  });

  await transporter.sendMail({
    from: smtp.from_email,
    to,
    subject,
    text,
    html: html || `<pre style="font-family:sans-serif">${text || ''}</pre>`,
    attachments,
  });

  return { sent: true };
};

module.exports = { sendMail };
