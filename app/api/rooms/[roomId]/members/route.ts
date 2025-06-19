import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(req: NextRequest, { params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const { data: members, error } = await supabase
    .from('room_users')
    .select('user_id, user_name')
    .eq('room_id', roomId);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch members', details: error }, { status: 500 });
  }

  return NextResponse.json(members);
} 