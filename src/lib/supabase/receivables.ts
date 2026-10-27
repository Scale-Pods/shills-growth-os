import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL_receivables_system || 'https://placeholder.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_receivables_system || 'placeholder';

/** Webhook the Upload Invoice modal posts to. */
export const UPLOAD_INVOICE_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_RECEIVABLES_upload_invoice_WEBHOOK_URL ||
  'https://n8n.srv1010832.hstgr.cloud/webhook-test/ff35f4f3-7469-4bf2-9fe5-ab15c8db9b3a';

/** Webhook the Party Ledger's Closed Yes/No buttons and partial-payment input post to. */
export const LEDGER_CLOSED_STATUS_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_RECEIVABLES_ledger_closed_status_WEBHOOK_URL ||
  'https://n8n.srv1010832.hstgr.cloud/webhook/ac4bb844-791b-44d2-b0b9-c88b5aa25dae';

// Client-side (browser) instance — anon key, subject to RLS.
export const receivablesClient = createClient(url, anonKey);

// Server-side instance — service role key, bypasses RLS. Only import
// this from server components / route handlers, never from client code.
export function getReceivablesServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY_receivables_system || 'placeholder';
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

/** Row of public.party_ledger — every column is text (or nullable) as stored. */
export interface PartyLedgerRow {
  id: number;
  party_name: string | null;
  opening_balance: string | null;
  particulars: string | null;
  voucher_no: string | null;
  bill_no: string | null;
  debit: string | null;
  credit: string | null;
  running_balance: string | null;
  narration: string | null;
  created_at: string | null;
  email: string | null;
  phone: string | null;
  closed: string | null;
  gstin: string | null;
  url: string | null;
  /** Outstanding amount for this ledger entry, as maintained by the backend (n8n). Source of truth for Net Outstanding. */
  Final_Amount: string | null;
  /** Date the client paid, as set by the backend once payment is recorded. Format: DD-MM-YYYY. */
  Payment_Date: string | null;
}

/** One outreach step's fields, repeated 1-8 times per channel on recovery_outreach_seq. */
export interface OutreachStepFields {
  date: string | null;
  content: string | null;
  status: string | null;
  sent_at: string | null;
  sentiment: string | null;
  note: string | null;
  reply: string | null;
}

/** One call step's fields (no per-step "reply" — call_conversation / call recording cover that). */
export interface CallStepFields {
  date: string | null;
  content: string | null;
  status: string | null;
  sent_at: string | null;
  sentiment: string | null;
  note: string | null;
  recording_url: string | null;
}

/** Row of public.recovery_outreach_seq. */
export interface RecoveryOutreachRow {
  id: number;
  party_name: string | null;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  overdue_amount: string | null;
  current_stage: string | null;
  next_action: string | null;
  next_action_date: string | null;
  status: string | null;
  dispute: string | null;
  founder_review: string | null;
  bill_no: string | null;
  voucher_no: string | null;
  transaction_date: string | null;
  cycle_started_date: string | null;
  sentiment: string | null;
  sentiment_score: string | null;
  intent: string | null;
  summary: string | null;
  closed: string | null;
  /** Outstanding amount incl. of all running_balance for this party — same convention as party_ledger.Final_Amount. */
  Final_Amount: string | null;
  Payment_Date: string | null;
  /** Amount yet to be paid, out of debit. */
  running_balance: string | null;
  oldest_due_date: string | null;
  max_overdue_days: string | null;
  created_at: string | null;
  updated_at: string | null;

  wa_1_date: string | null; wa_1_content: string | null; wa_1_status: string | null; wa_1_sent_at: string | null; wa_1_sentiment: string | null; wa_1_note: string | null; wa_1_reply: string | null;
  wa_2_date: string | null; wa_2_content: string | null; wa_2_status: string | null; wa_2_sent_at: string | null; wa_2_sentiment: string | null; wa_2_note: string | null; wa_2_reply: string | null;
  wa_3_date: string | null; wa_3_content: string | null; wa_3_status: string | null; wa_3_sent_at: string | null; wa_3_sentiment: string | null; wa_3_note: string | null; wa_3_reply: string | null;
  wa_4_date: string | null; wa_4_content: string | null; wa_4_status: string | null; wa_4_sent_at: string | null; wa_4_sentiment: string | null; wa_4_note: string | null; wa_4_reply: string | null;
  wa_5_date: string | null; wa_5_content: string | null; wa_5_status: string | null; wa_5_sent_at: string | null; wa_5_sentiment: string | null; wa_5_note: string | null; wa_5_reply: string | null;
  wa_6_date: string | null; wa_6_content: string | null; wa_6_status: string | null; wa_6_sent_at: string | null; wa_6_sentiment: string | null; wa_6_note: string | null; wa_6_reply: string | null;
  wa_7_date: string | null; wa_7_content: string | null; wa_7_status: string | null; wa_7_sent_at: string | null; wa_7_sentiment: string | null; wa_7_note: string | null; wa_7_reply: string | null;
  wa_8_date: string | null; wa_8_content: string | null; wa_8_status: string | null; wa_8_sent_at: string | null; wa_8_sentiment: string | null; wa_8_note: string | null; wa_8_reply: string | null;

  email_1_date: string | null; email_1_content: string | null; email_1_status: string | null; email_1_sent_at: string | null; email_1_sentiment: string | null; email_1_note: string | null; email_1_reply: string | null;
  email_2_date: string | null; email_2_content: string | null; email_2_status: string | null; email_2_sent_at: string | null; email_2_sentiment: string | null; email_2_note: string | null; email_2_reply: string | null;
  email_3_date: string | null; email_3_content: string | null; email_3_status: string | null; email_3_sent_at: string | null; email_3_sentiment: string | null; email_3_note: string | null; email_3_reply: string | null;
  email_4_date: string | null; email_4_content: string | null; email_4_status: string | null; email_4_sent_at: string | null; email_4_sentiment: string | null; email_4_note: string | null; email_4_reply: string | null;
  email_5_date: string | null; email_5_content: string | null; email_5_status: string | null; email_5_sent_at: string | null; email_5_sentiment: string | null; email_5_note: string | null; email_5_reply: string | null;
  email_6_date: string | null; email_6_content: string | null; email_6_status: string | null; email_6_sent_at: string | null; email_6_sentiment: string | null; email_6_note: string | null; email_6_reply: string | null;
  email_7_date: string | null; email_7_content: string | null; email_7_status: string | null; email_7_sent_at: string | null; email_7_sentiment: string | null; email_7_note: string | null; email_7_reply: string | null;
  email_8_date: string | null; email_8_content: string | null; email_8_status: string | null; email_8_sent_at: string | null; email_8_sentiment: string | null; email_8_note: string | null; email_8_reply: string | null;

  call_1_date: string | null; call_1_content: string | null; call_1_status: string | null; call_1_sent_at: string | null; call_1_sentiment: string | null; call_1_note: string | null; call_1_recording_url: string | null;
  call_2_date: string | null; call_2_content: string | null; call_2_status: string | null; call_2_sent_at: string | null; call_2_sentiment: string | null; call_2_note: string | null; call_2_recording_url: string | null;
  call_3_date: string | null; call_3_content: string | null; call_3_status: string | null; call_3_sent_at: string | null; call_3_sentiment: string | null; call_3_note: string | null; call_3_recording_url: string | null;
  call_4_date: string | null; call_4_content: string | null; call_4_status: string | null; call_4_sent_at: string | null; call_4_sentiment: string | null; call_4_note: string | null; call_4_recording_url: string | null;
  call_5_date: string | null; call_5_content: string | null; call_5_status: string | null; call_5_sent_at: string | null; call_5_sentiment: string | null; call_5_note: string | null; call_5_recording_url: string | null;
  call_6_date: string | null; call_6_content: string | null; call_6_status: string | null; call_6_sent_at: string | null; call_6_sentiment: string | null; call_6_note: string | null; call_6_recording_url: string | null;
  call_7_date: string | null; call_7_content: string | null; call_7_status: string | null; call_7_sent_at: string | null; call_7_sentiment: string | null; call_7_note: string | null; call_7_recording_url: string | null;
  call_8_date: string | null; call_8_content: string | null; call_8_status: string | null; call_8_sent_at: string | null; call_8_sentiment: string | null; call_8_note: string | null; call_8_recording_url: string | null;

  /** Full chat thread, same JSON-array-of-ConversationEntry shape as before — still the source for the Chats bubble view. */
  email_conversation: ConversationEntry[] | string | null;
  wa_conversation: ConversationEntry[] | string | null;

  /** Invoice amount. Credit is intentionally not modeled — this module shows Debit / Running Balance / Final Amount only. */
  debit: string | null;
  credit: string | null;
}

/** Reads step N's 7 fields off a WhatsApp or email row as one object, for loop-friendly access. */
export function outreachStep(row: RecoveryOutreachRow, channel: 'wa' | 'email', n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8): OutreachStepFields {
  const p = `${channel}_${n}_` as const;
  const r = row as unknown as Record<string, string | null>;
  return {
    date: r[`${p}date`] ?? null,
    content: r[`${p}content`] ?? null,
    status: r[`${p}status`] ?? null,
    sent_at: r[`${p}sent_at`] ?? null,
    sentiment: r[`${p}sentiment`] ?? null,
    note: r[`${p}note`] ?? null,
    reply: r[`${p}reply`] ?? null,
  };
}

/** Reads call step N's fields off a row as one object. */
export function callStep(row: RecoveryOutreachRow, n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8): CallStepFields {
  const p = `call_${n}_` as const;
  const r = row as unknown as Record<string, string | null>;
  return {
    date: r[`${p}date`] ?? null,
    content: r[`${p}content`] ?? null,
    status: r[`${p}status`] ?? null,
    sent_at: r[`${p}sent_at`] ?? null,
    sentiment: r[`${p}sentiment`] ?? null,
    note: r[`${p}note`] ?? null,
    recording_url: r[`${p}recording_url`] ?? null,
  };
}

/** One message inside email_conversation / wa_conversation JSONB. */
export interface ConversationEntry {
  role: string; // "business" | "customer" | ...
  stage?: string; // "Email 1", "WA 1", ...
  channel?: string; // "email" | "whatsapp"
  message: string;
  timestamp?: string; // "08/09/2026 00:08"
}

/**
 * n8n sometimes double-encodes JSONB columns (a JSON string of an array
 * instead of a real array). Unwrap until we get an array, else [].
 */
export function normalizeConversation(value: unknown): ConversationEntry[] {
  let current: unknown = value;
  for (let i = 0; i < 3; i++) {
    if (Array.isArray(current)) return current as ConversationEntry[];
    if (typeof current === 'string') {
      const trimmed = current.trim();
      if (!trimmed) return [];
      try {
        current = JSON.parse(trimmed);
        continue;
      } catch {
        return [];
      }
    }
    return [];
  }
  return Array.isArray(current) ? (current as ConversationEntry[]) : [];
}

/**
 * Parses the "dd/mm/yyyy HH:MM" timestamps used inside conversation JSON
 * into a real Date. Returns null on anything unparseable.
 */
export function parseConversationTimestamp(ts: string | null | undefined): Date | null {
  if (!ts) return null;
  const m = ts.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})/);
  if (!m) {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const [, dd, mm, yyyy, hh, min] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Parses a rupee amount that may be "434964.00", "", null, or "₹4,34,964.00". */
export function parseAmount(value: string | null | undefined): number {
  if (!value) return 0;
  const n = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** ₹ formatting, Indian grouping, no decimals. */
export function formatINR(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

/**
 * "Amount owed" for a recovery_outreach_seq row, wherever a single summary
 * figure is needed (metric tiles, sums). Final_Amount is the outstanding
 * amount inclusive of running_balance — the same convention used on the
 * Party Ledger page. Falls back to running_balance, then debit, if
 * Final_Amount isn't populated yet.
 */
export function outreachOwedAmount(row: RecoveryOutreachRow): number {
  if (row.Final_Amount) return parseAmount(row.Final_Amount);
  if (row.running_balance) return parseAmount(row.running_balance);
  return parseAmount(row.debit);
}
