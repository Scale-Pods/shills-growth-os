import type { TranscriptEntry } from './salonCrm';

/**
 * Some n8n writes double-encoded the transcript (JSON.stringify of an
 * already-jsonb array), so Supabase returns a string like
 * '"[{\\"direction\\":...}]"' instead of a real array. Unwrap until we
 * get an actual array, or give up and return [].
 */
export function normalizeTranscript(value: unknown): TranscriptEntry[] {
  let current: unknown = value;
  for (let i = 0; i < 3; i++) {
    if (Array.isArray(current)) return current as TranscriptEntry[];
    if (typeof current === 'string') {
      try {
        current = JSON.parse(current);
        continue;
      } catch {
        return [];
      }
    }
    return [];
  }
  return Array.isArray(current) ? (current as TranscriptEntry[]) : [];
}
