import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSalonCrmServiceClient } from '@/lib/supabase/salonCrm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Forgot password — step 1.
 * Verifies the email belongs to a real operator (public.users), then uses
 * Supabase Auth's built-in email service purely as an OTP transport:
 * signInWithOtp emails a 6-digit code. The code itself lives in Supabase
 * Auth; we only stamp an expiry marker on public.users.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  // Generic success either way — don't reveal whether the account exists.
  const ok = () =>
    NextResponse.json({ ok: true, message: 'If that email is registered, a reset code is on its way.' });

  const service = getSalonCrmServiceClient();
  const { data: user, error } = await service
    .from('users')
    .select('id, email')
    .ilike('email', email)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('forgot: users lookup failed:', error.message);
    return NextResponse.json({ error: 'Service unavailable. Try again shortly.' }, { status: 503 });
  }
  if (!user) return ok();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL_salon_crm!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_salon_crm!;
  const authClient = createClient(url, anon, { auth: { persistSession: false } });

  const { error: otpError } = await authClient.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (otpError) {
    console.error('forgot: signInWithOtp failed:', otpError.message);
    return NextResponse.json({ error: 'Could not send the reset code. Try again shortly.' }, { status: 502 });
  }

  // Marker so /api/auth/reset can reject stale attempts fast.
  await service
    .from('users')
    .update({ otp_expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString() })
    .eq('id', user.id);

  return ok();
}
