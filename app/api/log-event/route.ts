// app/api/log-event/route.ts
import { createClient } from '@/lib/supabase/server'; // Usar o client de servidor para a API Route
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid'; // Para gerar session_id se necessário

export async function POST(request: Request) {
  try {
    const { event_name, payload, session_id: client_session_id } = await request.json();

    if (!event_name) {
      return NextResponse.json({ error: 'event_name is required' }, { status: 400 });
    }

    const supabase = await createClient(); // Cria o cliente Supabase de servidor

    const { data: { user } } = await supabase.auth.getUser();

    // Usar o session_id do cliente ou gerar um novo se não existir
    // Para persistir o session_id no cliente, você precisará de um cookie ou localStorage
    const session_id = client_session_id || uuidv4();

    const { error } = await supabase
      .from('app_events')
      .insert({
        event_name,
        user_id: user?.id || null, // user_id será null se não houver usuário logado
        session_id: session_id,
        payload: payload || {},
      });

    if (error) {
      console.error('Error logging event to Supabase:', error);
      return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Event logged successfully', session_id }, { status: 200 });

  } catch (error) {
    console.error('Error in log-event API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}