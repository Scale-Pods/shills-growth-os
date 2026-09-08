import { NextRequest, NextResponse } from 'next/server';
import { getSalonCrmServiceClient } from '@/lib/supabase/salonCrm';
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const supabase = getSalonCrmServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, email, password_hash, full_name')
    .ilike('email', email)
    .limit(1)
    .maybeSingle();

  // Generic message either way — don't leak whether the email exists.
  const invalid = () =>
    NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });

  if (error) {
    console.error('Login lookup failed:', error.message);
    return NextResponse.json({ error: 'Authentication service unavailable.' }, { status: 503 });
  }
  const user = data as UserRow | null;
  if (!user || !verifyPassword(password, user.password_hash)) {
    return invalid();
  }

  const token = createSessionToken(user);
  const res = NextResponse.json({
    ok: true,
    token,
    user: { id: user.id, email: user.email, name: user.full_name },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
