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
}

/** Row of public.recovery_outreach. */
export interface RecoveryOutreachRow {
  id: number;
  party_name: string | null;
  email: string | null;
  phone: string | null;
  total_outstanding: string | null;
  overdue_amount: string | null;
  current_stage: string | null;
  next_action: string | null;
  next_action_date: string | null;

  email_1_date: string | null;
  email_1_content: string | null;
  email_1_sent_at: string | null;
  email_2_date: string | null;
  email_2_content: string | null;
  email_2_sent_at: string | null;
  email_3_date: string | null;
  email_3_content: string | null;
  email_3_sent_at: string | null;

  wa_1_date: string | null;
  wa_1_content: string | null;
  wa_1_sent_at: string | null;
  wa_2_date: string | null;
  wa_2_content: string | null;
  wa_2_sent_at: string | null;
  wa_3_date: string | null;
  wa_3_content: string | null;
  wa_3_sent_at: string | null;

  call_1_date: string | null;
  call_1_content: string | null;
  call_1_sent_at: string | null;
  call_2_date: string | null;
  call_2_content: string | null;
  call_2_sent_at: string | null;

  email_replied: string | null;
  email_conversation: ConversationEntry[] | string | null;
  wa_replied: string | null;
  wa_conversation: ConversationEntry[] | string | null;
  call_replied: string | null;
  call_conversation: string | null;

  status: string | null;
  dispute: string | null;
  founder_review: string | null;
  created_at: string | null;
  updated_at: string | null;
  bill_no: string | null;
  voucher_no: string | null;
  transaction_date: string | null;
  cycle_started_date: string | null;
  gstin: string | null;
  closed: string | null;
  sentiment: string | null;
  sentiment_score: string | null;
  intent: string | null;
  summary: string | null;
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
