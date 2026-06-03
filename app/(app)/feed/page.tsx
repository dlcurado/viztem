import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CardAnuncio from '@/components/CardAnuncio'
import FiltroCategorias from '@/components/FiltroCategorias'
import FeedHeader from '@/components/FeedHeader'
import { FirstFeedViewLogger } from '@/components/analytics/FirstFeedViewLogger'

// Tipagem do anúncio enriquecido
export type AnuncioComDetalhes = {
  id: string
  titulo: string
  descricao: string
  preco: number | null
  tipo_preco: 'fixo' | 'negociavel' | 'gratis'
  status: string
  criado_em: string
  categoria: {
    nome: string
    icone: string
  } | null
  autor: {
    nome: string
  } | null
  perfis: {
    bloco: string | null
    unidade: string | null
  } | null
  foto_capa: string | null
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>
}) {
  const supabase = await createClient()
  
  // 1. Verifica sessão
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Busca perfil do usuário logado
  const { data: perfilRaw, error: perfilError } = await supabase
    .from('perfis')
    .select('nome, condominio_id, condominios(nome)')
    .eq('id', user.id)
    .single()

  // Tipar manualmente para evitar inferência errada do Supabase
  const perfil = perfilRaw as {
    nome: string
    condominio_id: string
    condominios: { nome: string } | { nome: string }[] | null
  } | null

  // Se perfil não existe ou erro → redireciona para completar cadastro
  if (perfilError || !perfil?.condominio_id) {
    console.error('[Feed] Perfil não encontrado:', perfilError?.message)
    redirect('/login')
  }

  const condominioId = perfil.condominio_id
  const { categoria: categoriaFiltro } = await searchParams

  // --- NOVA QUERY PARA CONTAR ANÚNCIOS DO USUÁRIO ---
  const { count: userAnunciosCount, error: countError } = await supabase
    .from('anuncios')
    .select('id', { count: 'exact' }) // Seleciona apenas o ID e pede a contagem exata
    .eq('usuario_id', user.id)
    .eq('condominio_id', condominioId) // Garante que a contagem é do condomínio atual
    .eq('status', 'ativo'); // Apenas anúncios ativos contam para o limite

  if (countError) {
    console.error('[Feed] Erro ao contar anúncios do usuário:', countError.message);
    // Decida como tratar o erro, talvez assumir 0 ou um valor padrão
  }

  const countAnunciosRestantes = 5 - (userAnunciosCount ?? 0);

  // 3. Monta query de anúncios
  let query = supabase
    .from('anuncios')
    .select(`
      id,
      titulo,
      descricao,
      preco,
      tipo_preco,
      status,
      criado_em,
      categorias (
        nome,
        icone
      ),
      perfis (
        nome,
        bloco,
        unidade
      ),
      fotos_anuncio (
        url,
        ordem
      )
    `)
    .eq('condominio_id', condominioId)
    .eq('status', 'ativo')
    .order('criado_em', { ascending: false })
  
  // Aplica filtro de categoria se houver
  if (categoriaFiltro) {
    // Busca o id da categoria pelo slug
    const { data: cat } = await supabase
      .from('categorias')
      .select('id')
      .eq('slug', categoriaFiltro)
      .single()

    if (cat?.id) {
      query = query.eq('categoria_id', cat.id)
    }
  }

  const { data: anuncios, error: anunciosError } = await query

  if (anunciosError) {
    console.error('[Feed] Erro ao buscar anúncios:', anunciosError.message)
  }

  // 4. Normaliza dados para o componente
  const anunciosNormalizados: AnuncioComDetalhes[] = (anuncios ?? []).map(
    (a: any) => ({
      id: a.id,
      titulo: a.titulo,
      descricao: a.descricao,
      preco: a.preco,
      tipo_preco: a.tipo_preco ?? 'fixo',
      status: a.status,
      criado_em: a.criado_em,
      categoria: Array.isArray(a.categorias)
        ? (a.categorias[0] ?? null)
        : (a.categorias ?? null),

      autor: (() => {
        const p = Array.isArray(a.perfis) ? a.perfis[0] : a.perfis
        return p ? { nome: p.nome } : null
      })(),

      perfis: (() => {
        const p = Array.isArray(a.perfis) ? a.perfis[0] : a.perfis
        return p ? {
          bloco: p.bloco ?? null,
          unidade: p.unidade ?? null,
        } : null
      })(),
      // Pega a foto de menor ordem
      foto_capa:
        Array.isArray(a.fotos_anuncio) && a.fotos_anuncio.length > 0
          ? a.fotos_anuncio.sort(
              (x: any, y: any) => x.ordem - y.ordem
            )[0].url
          : null,
    })
  )

  // 5. Busca categorias para o filtro
  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nome, icone, slug')
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <FirstFeedViewLogger />
      <FeedHeader
        nomeUsuario={perfil.nome}
        nomeCondominio={
          Array.isArray(perfil.condominios)
            ? (perfil.condominios[0]?.nome ?? '')
            : (perfil.condominios?.nome ?? '')
        }
        countAnunciosRestantes={countAnunciosRestantes}
      />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Filtro de categorias */}
        <FiltroCategorias
          categorias={categorias ?? []}
          categoriaAtiva={categoriaFiltro ?? null}
        />

        {/* Grid responsivo */}
        {anunciosNormalizados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-4">📭</span>
            <p className="text-lg font-medium">Nenhum anúncio encontrado</p>
            <p className="text-sm mt-1">Seja o primeiro a anunciar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {anunciosNormalizados.map((anuncio) => (
              <CardAnuncio key={anuncio.id} anuncio={anuncio} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}