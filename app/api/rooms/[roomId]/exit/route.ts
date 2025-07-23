import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  const { roomId } = params
  const { user_id, user_name } = await req.json()
  
  console.log('Processing room exit for:', { roomId, user_id, user_name })

  try {
    // Insert an exit notification message that other participants can see
    const exitMessage = {
      room_id: roomId,
      sender_id: 'system',
      sender_role: 'system',
      content: `PARTICIPANT_EXITED:${user_name}`,
      created_at: new Date().toISOString()
    }

    const { data: insertedMessage, error } = await supabase
      .from('messages')
      .insert([exitMessage])
      .select()
      .single()

    if (error) {
      console.error('Error inserting exit notification:', error)
      return NextResponse.json({ error: 'Failed to notify room of exit' }, { status: 500 })
    }

    console.log('Exit notification sent:', insertedMessage)

    // Optionally update room status to indicate someone has left
    const { error: roomUpdateError } = await supabase
      .from('rooms')
      .update({ 
        status: 'ended',
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)

    if (roomUpdateError) {
      console.error('Error updating room status:', roomUpdateError)
      // Don't fail the request if room update fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Exit notification sent successfully' 
    })

  } catch (error) {
    console.error('Error processing room exit:', error)
    return NextResponse.json({ 
      error: 'Failed to process room exit' 
    }, { status: 500 })
  }
} 