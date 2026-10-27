import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';

const WEBHOOK_URL = process.env.OUTREACH_GENERATOR_WEBHOOK_URL;
const ALLOWED_EMAIL = (process.env.OUTREACH_SETTINGS_ALLOWED_EMAIL || '').toLowerCase();

const ALLOWED_SEQUENCE_TYPES = ['30_day'];
const ALLOWED_CHANNELS = ['whatsapp', 'email', 'voice_call'];
const SEQUENCE_LENGTH = 30;

interface DayEntry {
  day: number;
  channel: string | null;
}

/** Admin-only proxy to the outreach-sequence n8n webhook — session-gated to OUTREACH_SETTINGS_ALLOWED_EMAIL. */
export async function POST(request: NextRequest) {
  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session || session.email.toLowerCase() !== ALLOWED_EMAIL) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  if (!WEBHOOK_URL) {
    return NextResponse.json({ error: 'Outreach generator webhook is not configured.' }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { sequence_type, days } = body as { sequence_type?: unknown; days?: unknown };

  if (typeof sequence_type !== 'string' || !ALLOWED_SEQUENCE_TYPES.includes(sequence_type)) {
    return NextResponse.json({ error: `sequence_type must be one of: ${ALLOWED_SEQUENCE_TYPES.join(', ')}` }, { status: 400 });
  }
  if (!Array.isArray(days) || days.length !== SEQUENCE_LENGTH) {
    return NextResponse.json({ error: `days must be an array of exactly ${SEQUENCE_LENGTH} entries.` }, { status: 400 });
  }
  for (const entry of days as DayEntry[]) {
    if (
      !entry ||
      typeof entry.day !== 'number' ||
      entry.day < 1 ||
      entry.day > SEQUENCE_LENGTH ||
      (entry.channel !== null && !ALLOWED_CHANNELS.includes(entry.channel))
    ) {
      return NextResponse.json({ error: 'Each day entry must have day (1-30) and channel (whatsapp, email, voice_call, or null).' }, { status: 400 });
    }
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sequence_type, days }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Webhook response error (${response.status}): ${errorText || response.statusText}` },
        { status: response.status }
      );
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = { message: 'Success (No JSON response)' };
    }
    return NextResponse.json(responseData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to trigger webhook';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
