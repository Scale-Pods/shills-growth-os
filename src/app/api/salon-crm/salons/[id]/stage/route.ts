import { NextRequest, NextResponse } from 'next/server';
import { getSalonCrmServiceClient } from '@/lib/supabase/salonCrm';

const ALLOWED_STAGES = ['won', 'lost'] as const;
type AllowedStage = (typeof ALLOWED_STAGES)[number];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const stage = body?.stage as string | undefined;

  if (!stage || !ALLOWED_STAGES.includes(stage as AllowedStage)) {
    return NextResponse.json({ error: `stage must be one of: ${ALLOWED_STAGES.join(', ')}` }, { status: 400 });
  }

  const supabase = getSalonCrmServiceClient();
  const { data, error } = await supabase
    .from('salons')
    .update({ current_stage: stage, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ salon: data });
}
