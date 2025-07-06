import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(req: NextRequest, { params }: { params: { roomId: string } }) {
  const { roomId } = params;
  
  // Try to get position data, but fall back to basic data if columns don't exist
  let { data: members, error } = await supabase
    .from('room_users')
    .select('user_id, user_name, position_data, debate_topic')
    .eq('room_id', roomId);

  // If position_data columns don't exist, try without them
  if (error && error.message?.includes('column') && error.message?.includes('does not exist')) {
    console.log('Position data columns not found, falling back to basic member data');
    const { data: basicMembers, error: basicError } = await supabase
      .from('room_users')
      .select('user_id, user_name')
      .eq('room_id', roomId);
    
    if (basicError) {
      return NextResponse.json({ error: 'Failed to fetch members', details: basicError }, { status: 500 });
    }
    
    // Add null position data for backward compatibility
    members = basicMembers?.map(member => ({
      ...member,
      position_data: null,
      debate_topic: null
    })) || [];
  } else if (error) {
    return NextResponse.json({ error: 'Failed to fetch members', details: error }, { status: 500 });
  }

  return NextResponse.json(members);
} 