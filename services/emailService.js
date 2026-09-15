let transporterPromise = null;

function smtpConfig() {
  const host = String(process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  const from = String(process.env.SMTP_FROM || process.env.EMAIL_FROM || user).trim();
  return { host, port, user, pass, from };
}

export function emailDeliveryEnabled() {
  const { host, port, user, pass, from } = smtpConfig();
  return Boolean(host && port && user && pass && from);
}

export function assertEmailDeliveryConfigured() {
  if (emailDeliveryEnabled()) return;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El servicio de email no está configurado. Configura SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y SMTP_FROM.');
  }
}

async function getTransporter() {
  if (!emailDeliveryEnabled()) return null;
  if (!transporterPromise) {
    transporterPromise = import('nodemailer').then(({ default: nodemailer }) => {
      const { host, port, user, pass } = smtpConfig();
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        requireTLS: port === 587,
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 20_000
      });
    });
  }
  return transporterPromise;
}

function appUrl() {
  return String(process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

async function deliver({ to, subject, text, html, devLink }) {
  const transporter = await getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[DEV EMAIL] ${subject} -> ${to}: ${devLink || ''}`);
      return { dev: true };
    }
    throw new Error('El servicio de email no está disponible.');
  }
  const { from } = smtpConfig();
  return transporter.sendMail({ from: `Sin Barreras <${from}>`, to, subject, text, html });
}

export async function sendVerificationEmail(user, rawToken) {
  const link = `${appUrl()}/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
  const name = String(user.name || 'usuario').trim();
  return deliver({
    to: user.email,
    subject: 'Verifica tu email · Sin Barreras',
    text: `Hola ${name}. Verifica tu email para activar tu cuenta de Sin Barreras: ${link}\n\nEste enlace vence en 24 horas.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Verifica tu email</h2><p>Hola ${escapeHtml(name)}. Confirma que este email te pertenece para activar tu cuenta de Sin Barreras.</p><p><a href="${link}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#dc6247;color:#fff;text-decoration:none;font-weight:700">VERIFICAR EMAIL</a></p><p style="color:#68777a;font-size:12px">Este enlace vence en 24 horas. Si no creaste esta cuenta, puedes ignorar este mensaje.</p></div>`,
    devLink: link
  });
}

export async function sendPasswordResetEmail(user, rawToken) {
  const link = `${appUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const name = String(user.name || 'usuario').trim();
  return deliver({
    to: user.email,
    subject: 'Restablece tu contraseña · Sin Barreras',
    text: `Hola ${name}. Usa este enlace para crear una nueva contraseña: ${link}\n\nEste enlace vence en 30 minutos.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Restablecer contraseña</h2><p>Hola ${escapeHtml(name)}. Recibimos una solicitud para cambiar tu contraseña.</p><p><a href="${link}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#dc6247;color:#fff;text-decoration:none;font-weight:700">CREAR NUEVA CONTRASEÑA</a></p><p style="color:#68777a;font-size:12px">Este enlace vence en 30 minutos. Si no solicitaste el cambio, ignora este mensaje.</p></div>`,
    devLink: link
  });
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
