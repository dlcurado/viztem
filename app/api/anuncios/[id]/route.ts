import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  

  // Get current authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Check if the authenticated user is the owner of the anuncio or is admin
  const { data: perfilRaw, error: perfilError } = await supabase
    .from('perfis')
    .select('role')
    .eq('id', user.id)
    .single();

  const perfil = perfilRaw as {
    role: string
  } | null

  // Fetch anuncio with related perfil/autor
  let query = supabase
    .from('anuncios')
    .select(`id`)
    .eq('id', id)
  
  if(perfil?.role !== 'admin') {
    query = query.eq('owner_user_id', user.id)
  }

  const { data: anuncio, error: fetchError } = await query
    .maybeSingle();

  if (fetchError) {
    console.error('[api/anuncios/[id] DELETE] fetch error', fetchError.message)
    return new NextResponse('Error fetching anuncio', { status: 500 })
  }

  if (!anuncio) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Perform delete
  const { error: deleteError } = await supabase
    .from('anuncios')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('[api/anuncios/[id] DELETE] delete error', deleteError.message)
    return new NextResponse('Error deleting anuncio', { status: 500 })
  }

  return NextResponse.json({ success: true })
}
