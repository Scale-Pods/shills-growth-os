import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSalonCrmServiceClient } from '@/lib/supabase/salonCrm';
import { hashPassword } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Forgot password — step 2. Two accepted proofs of inbox control:
 *
 *   A) { access_token, password } — from the reset LINK. The email client
 *      opened .../reset-password#access_token=… ; the page hands us that
 *      token. We validate it with Supabase Auth getUser() and read the email.
 *
 *   B) { email, code, password } — from the 6-digit CODE fallback. Verified
 *      via Supabase Auth verifyOtp().
 *
 * Either way, on success we write a fresh PBKDF2 hash to public.users
 * (the table login actually runs off) and drop the transient Auth session.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';
  const accessToken = typeof body?.access_token === 'string' ? body.access_token.trim() : '';
  const emailIn = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const code = typeof body?.code === 'string' ? body.code.trim() : '';

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL_salon_crm!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_salon_crm!;
  const authClient = createClient(url, anon, { auth: { persistSession: false } });

  let verifiedEmail: string | null = null;

  if (accessToken) {
    // Mode A — reset link.
    const { data, error } = await authClient.auth.getUser(accessToken);
    if (error || !data?.user?.email) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired. Request a new one.' }, { status: 400 });
    }
    verifiedEmail = data.user.email.toLowerCase();
  } else {
    // Mode B — 6-digit code.
    if (!emailIn || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailIn)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Enter the 6-digit code from your email.' }, { status: 400 });
    }
    const { data, error } = await authClient.auth.verifyOtp({ email: emailIn, token: code, type: 'email' });
    if (error || !data?.user) {
      return NextResponse.json({ error: 'That code is invalid or has expired. Request a new one.' }, { status: 400 });
    }
    verifiedEmail = emailIn;
  }

  // Drop any Auth session — login runs off public.users only.
  await authClient.auth.signOut().catch(() => {});

  const service = getSalonCrmServiceClient();
  const { data: user, error: lookupError } = await service
    .from('users')
    .select('id, email')
    .ilike('email', verifiedEmail)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error('reset: users lookup failed:', lookupError.message);
    return NextResponse.json({ error: 'Service unavailable. Try again shortly.' }, { status: 503 });
  }
  if (!user) {
    // Inbox was verified but there's no operator account for it.
    return NextResponse.json({ error: 'No account is registered for that email.' }, { status: 400 });
  }

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
