'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

// 'link'  = arrived via the reset link (#access_token in URL) -> set new password directly
// 'email' = manual: ask for email -> send code
// 'code'  = manual: enter 6-digit code + new password
// 'done'  = success
type Step = 'link' | 'email' | 'code' | 'done';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Pull the Supabase auth params out of the URL hash fragment. */
function readAuthHash(): { accessToken: string | null; type: string | null; error: string | null } {
  if (typeof window === 'undefined') return { accessToken: null, type: null, error: null };
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const p = new URLSearchParams(hash);
  return {
    accessToken: p.get('access_token'),
    type: p.get('type'),
    error: p.get('error_description') || p.get('error'),
  };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // On load, check for a reset link (#access_token=…). If present, skip
  // straight to the new-password form and clear the hash from the address bar.
  useEffect(() => {
    const { accessToken, error: hashError } = readAuthHash();
    if (hashError) {
      setError('This reset link is invalid or has expired. Request a new one below.');
      setStep('email');
      history.replaceState(null, '', window.location.pathname);
      return;
    }
    if (accessToken) {
      setLinkToken(accessToken);
      setStep('link');
      history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const sendCode = async () => {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Could not send the code.');
        return;
      }
      setNotice(data?.message || 'If that email is registered, a reset email is on its way.');
      setStep('code');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async () => {
    setError(null);
    if (step === 'code' && !/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const payload =
        step === 'link'
          ? { access_token: linkToken, password }
          : { email: email.trim(), code: code.trim(), password };
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Could not reset the password.');
        return;
      }
      setStep('done');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    outline: 'none',
    fontSize: '13.5px',
    background: 'rgba(0,0,0,0.2)',
    color: '#fff',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.6)',
    display: 'block',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const passwordFields = (
    <>
      <div>
        <label style={labelStyle}>New password</label>
        <div style={{ position: 'relative' }}>
          <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            style={{ ...inputStyle, paddingLeft: '34px' }}
            required
          />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Confirm new password</label>
        <div style={{ position: 'relative' }}>
          <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(null); }}
            style={{ ...inputStyle, paddingLeft: '34px' }}
            required
          />
        </div>
      </div>
    </>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(20, 20, 25, 0.6)',
          backdropFilter: 'blur(30px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'rgba(0,122,255,0.12)',
              border: '1px solid rgba(0,122,255,0.25)',
              margin: '0 auto 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4aa3ff',
            }}
          >
            {step === 'done' ? <CheckCircle2 size={26} /> : <KeyRound size={24} />}
          </div>
          <h1 style={{ fontSize: '19px', fontWeight: 800, color: '#fff', margin: 0 }}>
            {step === 'done' ? 'Password updated' : step === 'link' ? 'Set a new password' : 'Reset your password'}
          </h1>
          <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.55)', marginTop: '6px', lineHeight: 1.4 }}>
            {step === 'email' && 'Enter your account email and we’ll send you a reset email.'}
            {step === 'code' && 'Enter the 6-digit code from your email and choose a new password.'}
            {step === 'link' && 'Choose a new password for your account.'}
            {step === 'done' && 'You can now sign in with your new password.'}
          </p>
        </div>

        {notice && step !== 'done' && (
          <div
            style={{
              background: 'rgba(0, 122, 255, 0.1)',
              border: '1px solid rgba(0, 122, 255, 0.25)',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '16px',
              fontSize: '11.5px',
              color: '#7ab8ff',
            }}
          >
            {notice}
          </div>
        )}

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 59, 48, 0.1)',
              border: '1px solid rgba(255, 59, 48, 0.25)',
              padding: '10px 12px',
              borderRadius: '10px',
              marginBottom: '16px',
            }}
          >
            <AlertTriangle size={14} style={{ color: '#ff453a', flexShrink: 0 }} />
            <span style={{ fontSize: '11.5px', color: '#ff453a', lineHeight: 1.3 }}>{error}</span>
          </div>
        )}

        {step === 'link' && (
          <form onSubmit={(e) => { e.preventDefault(); if (!busy) submitReset(); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {passwordFields}
            <button type="submit" disabled={busy} style={submitBtn(busy)}>
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        {step === 'email' && (
          <form onSubmit={(e) => { e.preventDefault(); if (!busy) sendCode(); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  style={{ ...inputStyle, paddingLeft: '34px' }}
                  required
                />
              </div>
            </div>
            <button type="submit" disabled={busy} style={submitBtn(busy)}>
              {busy ? 'Sending…' : 'Send reset email'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={(e) => { e.preventDefault(); if (!busy) submitReset(); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>6-digit code</label>
              <input
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(null); }}
                style={{ ...inputStyle, letterSpacing: '0.4em', textAlign: 'center', fontSize: '18px' }}
                required
              />
            </div>
            {passwordFields}
            <button type="submit" disabled={busy} style={submitBtn(busy)}>
              {busy ? 'Updating…' : 'Update password'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError(null); setNotice(null); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
            >
              <ArrowLeft size={13} /> Use a different email
            </button>
          </form>
        )}

        {step === 'done' && (
          <button onClick={() => router.push('/')} style={submitBtn(false)}>
            Go to sign in
          </button>
        )}

        <div style={{ textAlign: 'center', fontSize: '10.5px', color: 'rgba(255,255,255,0.35)', marginTop: '18px' }}>
          Secured Gateway • Powered by <span style={{ color: '#4aa3ff', fontWeight: 600 }}>ScalePods</span>
        </div>
      </div>
    </div>
  );
}

function submitBtn(busy: boolean): React.CSSProperties {
  return {
    padding: '13px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #007aff, #af52de)',
    color: 'white',
    fontWeight: 700,
    cursor: busy ? 'wait' : 'pointer',
    fontSize: '14px',
    marginTop: '4px',
    opacity: busy ? 0.7 : 1,
  };
}
