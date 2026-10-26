// Goldstein Scheduler | Phase 11 | Session 6 | Build 3 | 2026-10-25 21:10 ET | Netlify Function: email an alert for every swap/event change (Gmail SMTP). BETA mode sends only to Aaron.
import nodemailer from 'nodemailer';

const ACTORS = ['aaron', 'rebecca', 'lisa'];
const clean = (s, n) => String(s ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, n);

// Pure: payload + env in, message out (or { skip } / { bad }). Tested without any network.
export function buildMessage(payload, env) {
  const actor = clean(payload?.actor, 20).toLowerCase();
  const text = clean(payload?.text, 300);
  if (!ACTORS.includes(actor) || !text) return { bad: 'actor and text are required' };
  const lines = Array.isArray(payload.lines) ? payload.lines.slice(0, 8).map((l) => clean(l, 200)).filter(Boolean) : [];

  const emailOf = (a) => clean(env[`ALERT_EMAIL_${a.toUpperCase()}`], 200);
  const live = env.ALERT_LIVE === 'true';
  const everyoneElse = ACTORS.filter((a) => a !== actor && emailOf(a));
  // BETA (default): only Aaron gets mail, whatever the change. Live: everyone except the person who made it.
  const to = live ? everyoneElse.map(emailOf) : [emailOf('aaron') || clean(env.GMAIL_USER, 200)].filter(Boolean);
  if (!to.length) return { skip: 'no recipients configured' };

  const site = clean(env.URL, 200);
  const body = [
    ...(live ? [] : ['BETA TEST: sample data, only Aaron receives these. After launch this goes to: ' + (everyoneElse.join(', ') || 'nobody configured') + '.', '']),
    text,
    ...(lines.length ? ['', ...lines.map((l) => '  ' + l)] : []),
    ...(site ? ['', 'Open the scheduler: ' + site] : []),
  ].join('\n');

  return { to, subject: (live ? '' : '[BETA] ') + text.slice(0, 120), text: body };
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  try {
    const msg = buildMessage(JSON.parse(event.body || '{}'), process.env);
    if (msg.bad) return { statusCode: 400, body: JSON.stringify({ error: msg.bad }) };
    if (msg.skip) return { statusCode: 200, body: JSON.stringify({ sent: false, reason: msg.skip }) };
    const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return { statusCode: 200, body: JSON.stringify({ sent: false, reason: 'GMAIL_USER / GMAIL_APP_PASSWORD not set' }) };

    const transport = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } });
    await transport.sendMail({ from: `Goldstein Scheduler <${GMAIL_USER}>`, to: msg.to.join(', '), subject: msg.subject, text: msg.text });
    return { statusCode: 200, body: JSON.stringify({ sent: true, count: msg.to.length }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
