import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL_salon_crm || 'https://placeholder.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_salon_crm || 'placeholder';

// Client-side (browser) instance — anon key, subject to RLS.
export const salonCrmClient = createClient(url, anonKey);

// Server-side instance — service role key, bypasses RLS. Only import
// this from server components / route handlers, never from client code.
export function getSalonCrmServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY_salon_crm || 'placeholder';
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export interface TranscriptEntry {
  direction: 'inbound' | 'outbound';
  message: string;
  at: string;
}

export interface Salon {
  id: string;
  google_place_id: string | null;
  salon_name: string;
  category: string;
  region: string;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  google_rating: number | null;
  google_reviews_count: number | null;
  lead_source: string;
  current_stage: string;
  assigned_rep_id: string | null;
  is_active: boolean;
  notes: string | null;
  conversation_transcript: TranscriptEntry[];
  conversation_transcript_email: TranscriptEntry[];
  last_reply_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsappLog {
  id: string;
  salon_id: string;
  direction: 'outbound' | 'inbound';
  outreach_step: string | null;
  message_body: string | null;
  template_name: string | null;
  whatsapp_message_id: string | null;
  status: string;
  interest: string | null;
  intent: string | null;
  interest_score: number | null;
  reply_summary: string | null;
  created_at: string;
}

export interface EmailLog {
  id: string;
  salon_id: string;
  direction: 'outbound' | 'inbound';
  outreach_step: string | null;
  subject: string | null;
  body: string | null;
  email_message_id: string | null;
  status: string;
  interest: string | null;
  intent: string | null;
  interest_score: number | null;
  reply_summary: string | null;
  created_at: string;
}
