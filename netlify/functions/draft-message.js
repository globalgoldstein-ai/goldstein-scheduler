// Goldstein Scheduler | Phase 7 | Session 1 | Build 1 | 2026-07-13 00:48 ET | Netlify Function: draft co-parent message

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  try {
    const { conflict, alternate, sender } = JSON.parse(event.body);

    const facts = [
      `Sender: ${sender}`,
      `Conflict: an agreed swap (${conflict.swapStart} to ${conflict.swapEnd}) overlaps ${conflict.eventCategory} "${conflict.eventTitle}" (${conflict.eventStart} to ${conflict.eventEnd}).`,
      alternate
        ? `Proposed alternate swap window (already checked as valid): ${alternate.date_start} to ${alternate.date_end}.`
        : `No clean alternate window was found — ask to discuss.`,
    ].join('\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system:
          'You draft short, warm, practical text messages between co-parents. ' +
          'Rules: under 320 characters. Plain, friendly, no corporate tone, no emoji, no greeting boilerplate. ' +
          'Use ONLY the dates given — never invent or alter a date. ' +
          'Propose the alternate window as a suggestion and explicitly invite the other parent to counter or discuss. ' +
          'Return ONLY the message text, no preamble, no quotes, no markdown.',
        messages: [{ role: 'user', content: `Draft a text to my co-parent Lisa.\n\n${facts}` }],
      }),
    });

    const data = await res.json();
    if (data.error) return { statusCode: 502, body: JSON.stringify({ error: data.error.message }) };

    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
    return { statusCode: 200, body: JSON.stringify({ text }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
