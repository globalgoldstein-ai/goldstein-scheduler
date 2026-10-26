// Goldstein Scheduler | Phase 11 | Session 6 | Build 6 | 2026-10-25 21:59 ET | Netlify Function: HTML email alert for every swap/event change (Gmail SMTP). Action-needed vs FYI, button deep-links to the swap. BETA sends only to Aaron.
import nodemailer from 'nodemailer';

const ACTORS = ['aaron', 'rebecca', 'lisa'];
const HOUSEHOLDS = ['aaron_rebecca', 'lisa'];
const hhOf = (a) => (a === 'lisa' ? 'lisa' : 'aaron_rebecca');
const HH_LABEL = { aaron_rebecca: 'Aaron/Rebecca', lisa: 'Lisa' };
const clean = (s, n) => String(s ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, n);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cap = (a) => a[0].toUpperCase() + a.slice(1);

function render({ preview, actionNeeded, needsLabel, headline, facts, lines, url, button, beta, previewNote }) {
  const rows = facts.map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#667;font-size:14px;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;font-size:15px;font-weight:600;color:#1b2430">${esc(v)}</td></tr>`).join('');
  const badge = actionNeeded
    ? `<span style="display:inline-block;padding:4px 10px;border-radius:12px;background:#fff3cd;color:#8a5a00;font-size:12px;font-weight:800;letter-spacing:.5px">ACTION NEEDED${needsLabel ? ' FROM ' + esc(needsLabel.toUpperCase()) : ''}</span>`
    : `<span style="display:inline-block;padding:4px 10px;border-radius:12px;background:#eceff3;color:#556;font-size:12px;font-weight:800;letter-spacing:.5px">FOR YOUR INFO</span>`;
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f3f5f8;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f3f5f8">${esc(preview)}</div>
<div style="max-width:520px;margin:0 auto;padding:16px">
${beta ? `<div style="margin-bottom:12px;padding:8px 12px;border-radius:8px;background:#fff3cd;border:1px solid #e0b43a;color:#5c4400;font-size:12px;line-height:1.4"><b>Beta test, sample data.</b> ${esc(previewNote)}</div>` : ''}
<div style="background:#fff;border-radius:12px;padding:20px;border:1px solid #e3e8ef">
<div style="margin-bottom:10px">${badge}</div>
<div style="font-size:20px;line-height:1.3;font-weight:800;color:#1b2430;margin-bottom:12px">${esc(headline)}</div>
<table role="presentation" style="border-collapse:collapse;margin-bottom:8px">${rows}</table>
${lines.length ? `<div style="font-size:13px;color:#667;margin:8px 0">${lines.map(esc).join('<br>')}</div>` : ''}
<a href="${esc(url)}" style="display:block;margin-top:16px;padding:16px;border-radius:10px;background:#2e7d32;color:#ffffff;text-align:center;font-size:17px;font-weight:800;text-decoration:none">${esc(button)}</a>
<div style="margin-top:10px;font-size:12px;color:#889;text-align:center">Opens the scheduler${actionNeeded ? ' on this request, ready for Agree or Let\'s talk' : ''}.</div>
</div>
<div style="margin-top:10px;font-size:11px;color:#99a;text-align:center">Goldstein Kids Scheduler</div>
</div></body></html>`;
  const text = [
    ...(beta ? ['BETA TEST, sample data. ' + previewNote, ''] : []),
    actionNeeded ? 'ACTION NEEDED' + (needsLabel ? ' FROM ' + needsLabel.toUpperCase() : '') : 'FOR YOUR INFO',
    headline, '',
    ...facts.map(([k, v]) => k + ': ' + v),
    ...(lines.length ? ['', ...lines] : []),
    '', button + ': ' + url,
  ].join('\n');
  return { html, text };
}

// Pure: payload + env in, messages out (or { skip } / { bad }). Tested without any network.
export function buildMessages(payload, env) {
  const actor = clean(payload?.actor, 20).toLowerCase();
  const headline = clean(payload?.headline, 200);
  const subjectLine = clean(payload?.subject, 90) || headline.slice(0, 90);
  if (!ACTORS.includes(actor) || !headline) return { bad: 'actor and headline are required' };
  const needs = HOUSEHOLDS.includes(payload.needs) ? payload.needs : null;
  const facts = Array.isArray(payload.facts) ? payload.facts.slice(0, 8).map((f) => [clean(f?.[0], 40), clean(f?.[1], 200)]).filter((f) => f[0] && f[1]) : [];
  const lines = Array.isArray(payload.lines) ? payload.lines.slice(0, 8).map((l) => clean(l, 200)).filter(Boolean) : [];
  const swapId = /^[A-Za-z0-9_-]{1,64}$/.test(payload.swapId ?? '') ? payload.swapId : null;

  const emailOf = (a) => clean(env[`ALERT_EMAIL_${a.toUpperCase()}`], 200);
  const live = env.ALERT_LIVE === 'true';
  const others = ACTORS.filter((a) => a !== actor && emailOf(a));
  const site = clean(env.URL, 200).replace(/\/$/, '');
  const url = site ? site + (swapId ? '/?swap=' + swapId : '/') : '#';

  let targets; // [{ to, actionNeeded }]
  let previewNote = '';
  if (live) {
    targets = others.map((a) => ({ to: emailOf(a), actionNeeded: !!needs && hhOf(a) === needs }));
  } else {
    const to = emailOf('aaron') || clean(env.GMAIL_USER, 200);
    targets = to ? [{ to, actionNeeded: !!needs }] : [];
    const act = others.filter((a) => needs && hhOf(a) === needs).map(cap);
    const fyi = others.filter((a) => !(needs && hhOf(a) === needs)).map(cap);
    previewNote = 'Only Aaron gets these for now. After launch: ' + (act.length ? 'action request to ' + act.join(' and ') : 'no action request') + (fyi.length ? '; for-your-info copy to ' + fyi.join(' and ') : '') + '.';
  }
  if (!targets.length) return { skip: 'no recipients configured' };

  const button = needs ? 'Review and respond' : 'Open the scheduler';
  return {
    messages: targets.map((t) => {
      const body = render({ preview: (t.actionNeeded ? 'Tap to agree or talk. ' : '') + facts.map((f) => f[0] + ': ' + f[1]).join('. '), actionNeeded: t.actionNeeded, needsLabel: needs ? HH_LABEL[needs] : '', headline, facts, lines, url, button: t.actionNeeded ? 'Review and respond' : button === 'Review and respond' ? 'Open the request' : button, beta: !live, previewNote });
      return { to: t.to, subject: (t.actionNeeded ? 'Action needed: ' : '') + subjectLine + (live ? '' : ' [BETA]'), html: body.html, text: body.text };
    }),
  };
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  try {
    const out = buildMessages(JSON.parse(event.body || '{}'), process.env);
    if (out.bad) return { statusCode: 400, body: JSON.stringify({ error: out.bad }) };
    if (out.skip) return { statusCode: 200, body: JSON.stringify({ sent: false, reason: out.skip }) };
    const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return { statusCode: 200, body: JSON.stringify({ sent: false, reason: 'GMAIL_USER / GMAIL_APP_PASSWORD not set' }) };

    const transport = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } });
    for (const m of out.messages) {
      await transport.sendMail({ from: `Goldstein Scheduler <${GMAIL_USER}>`, to: m.to, subject: m.subject, text: m.text, html: m.html });
    }
    return { statusCode: 200, body: JSON.stringify({ sent: true, count: out.messages.length }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
