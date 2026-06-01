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

  // Fetch anuncio with related perfil/autor
  const { data: anuncio, error: fetchError } = await supabase
    .from('anuncios')
    .select('perfis ( id )')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    console.error('[api/anuncios/[id] DELETE] fetch error', fetchError.message)
    return new NextResponse('Error fetching anuncio', { status: 500 })
  }

  if (!anuncio) {
    return new NextResponse('Not found', { status: 404 })
  }

  const perfil = Array.isArray(anuncio.perfis)
    ? anuncio.perfis[0]
    : anuncio.perfis

  const ownerId = perfil?.id
  if (!ownerId || ownerId !== user.id) {
    return new NextResponse('Forbidden', { status: 403 })
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
