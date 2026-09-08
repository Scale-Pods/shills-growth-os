import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSalonCrmServiceClient } from '@/lib/supabase/salonCrm';
import { hashPassword } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Forgot password — step 2.
 * Verifies the 6-digit code via Supabase Auth's verifyOtp (proves inbox
 * control), then writes a fresh PBKDF2 hash to public.users and drops the
 * transient Auth session.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Enter the 6-digit code from your email.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const service = getSalonCrmServiceClient();
  const { data: user, error: lookupError } = await service
    .from('users')
    .select('id, email')
    .ilike('email', email)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error('reset: users lookup failed:', lookupError.message);
    return NextResponse.json({ error: 'Service unavailable. Try again shortly.' }, { status: 503 });
  }
  if (!user) {
    return NextResponse.json({ error: 'Invalid code or email.' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL_salon_crm!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_salon_crm!;
  const authClient = createClient(url, anon, { auth: { persistSession: false } });

  const { data: verified, error: verifyError } = await authClient.auth.verifyOtp({
    email,
    token: code,
    type: 'email',
  });

  if (verifyError || !verified?.user) {
    return NextResponse.json({ error: 'That code is invalid or has expired. Request a new one.' }, { status: 400 });
  }

  // Drop the Auth session we just created — login runs off public.users only.
  await authClient.auth.signOut().catch(() => {});

  const { error: updateError } = await service
    .from('users')
    .update({
      password_hash: hashPassword(password),
      passwords_changed_at: new Date().toISOString(),
      otp_code: null,
      otp_expires_at: null,
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('reset: password update failed:', updateError.message);
    return NextResponse.json({ error: 'Could not update the password. Try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: 'Password updated. You can sign in now.' });
}
