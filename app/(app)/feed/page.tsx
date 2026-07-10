import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CardAnuncio from '@/components/CardAnuncio'
import FiltroCategorias from '@/components/FiltroCategorias'
import FeedHeader from '@/components/FeedHeader'
import { FirstFeedViewLogger } from '@/components/analytics/FirstFeedViewLogger'
import RegionalBannerCarousel from '@/components/RegionalBannerCarousel'

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
  created_by_user_id: string
  autor: {
    id: string
    nome: string
    bloco: string | null
    unidade: string | null
  } | null
  owner_user_id: string
  owner:{
    id: string
    nome: string
    bloco: string | null
    unidade: string | null
  } | null
  contact_whatsapp: string | null
  contact_url: string | null
  foto_capa: string | null
  tipo_anuncio: 'hiperlocal' | 'regional_banner' | 'regional_card'
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

  // Busca perfil do usuário logado
  const { data: perfilRaw, error: perfilError } = await supabase
    .from('perfis')
    .select('nome, condominio_id, condominios(nome), role')
    .eq('id', user.id)
    .single()

  // Tipar manualmente para evitar inferência errada do Supabase
  const perfil = perfilRaw as {
    nome: string
    role: string
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

  // CONTAR ANÚNCIOS DO USUÁRIO
  const { count: userAnunciosCount, error: countError } = await supabase
    .from('anuncios')
    .select('id', { count: 'exact' }) // Seleciona apenas o ID e pede a contagem exata
    .eq('owner_user_id', user.id)
    .eq('condominio_id', condominioId) // Garante que a contagem é do condomínio atual
    .eq('status', 'ativo'); // Apenas anúncios ativos contam para o limite

  if (countError) {
    console.error('[Feed] Erro ao contar anúncios do usuário:', countError.message);
    // Decida como tratar o erro, talvez assumir 0 ou um valor padrão
  }

  const countAnunciosRestantes = 5 - (userAnunciosCount ?? 0);

  // --- Busca de Anúncios Regionais (Banners) ---
  const { data: bannersRaw, error: bannersError } = await supabase
    .from('anuncios')
    .select(`
      id,
      titulo,
      descricao,
      tipo_preco,
      contact_url,
      fotos_anuncio ( url, ordem )
    `)
    .eq('tipo_anuncio', 'regional_banner')
    .eq('status', 'ativo')
    .order('criado_em', { ascending: false })
    .limit(5);

  if (bannersError) {
    console.error('[Feed] Erro ao buscar banners regionais:', bannersError.message)
  }

  const bannersNormalizados = (bannersRaw ?? []).map((b: any) => ({
    id: b.id,
    titulo: b.titulo,
    descricao: b.descricao,
    tipo_preco: b.tipo_preco,
    contact_url: b.contact_url,
    foto_capa:
      Array.isArray(b.fotos_anuncio) && b.fotos_anuncio.length > 0
        ? b.fotos_anuncio.sort((x: any, y: any) => x.ordem - y.ordem)[0].url
        : null,
  }));

  //  Monta query de anúncios
  let queryAnunciosFeed = supabase
    .from('anuncios')
    .select(`
      id,
      titulo,
      descricao,
      preco,
      tipo_preco,
      status,
      criado_em,
      created_by_user_id,
      owner_user_id,
      categorias (
        nome,
        icone
      ),
      autor:created_by_user_id (
        id,
        nome,
        bloco,
        unidade
      ),
      owner:owner_user_id (
        id,
        nome,
        bloco,
        unidade
      ),
      contact_whatsapp,
      contact_url,
      fotos_anuncio (
        url,
        ordem
      ),
      tipo_anuncio
    `)
    .eq('status', 'ativo')
    .or(`tipo_anuncio.eq.regional_card, and(tipo_anuncio.eq.hiperlocal, condominio_id.eq.${condominioId})`)
    .order('criado_em', { ascending: true })
  
    // Aplica filtro de categoria se houver
  if (categoriaFiltro) {
    // Busca o id da categoria pelo slug
    const { data: cat } = await supabase
      .from('categorias')
      .select('id')
      .eq('slug', categoriaFiltro)
      .single()

    if (cat?.id) {
      queryAnunciosFeed = queryAnunciosFeed.eq('categoria_id', cat.id)
    }
  }

  //console.log('[Feed] Query de anúncios montada:', queryAnunciosFeed)

  const { data: anuncios, error: anunciosError } = await queryAnunciosFeed

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

      created_by_user_id: a.created_by_user_id,
      autor: (() => {
        const p = Array.isArray(a.autor) ? a.autor[0] : a.autor
        return p ? { id: p.id, nome: p.nome, bloco: p.bloco, unidade: p.unidade } : null
      })(),

      owner_user_id: a.owner_user_id,
      owner: (() => {
        const p = Array.isArray(a.owner) ? a.owner[0] : a.owner
        return p ? { id: p.id, nome: p.nome, bloco: p.bloco, unidade: p.unidade } : null
      })(),

      contact_whatsapp: a.contact_whatsapp,
      contact_url: a.contact_url,

      // Pega a foto de menor ordem
      foto_capa:
        Array.isArray(a.fotos_anuncio) && a.fotos_anuncio.length > 0
          ? a.fotos_anuncio.sort(
              (x: any, y: any) => x.ordem - y.ordem
            )[0].url
          : null,
        
      tipo_anuncio: a.tipo_anuncio,
    })
  )

  const { data: categoriasComAnunciosIds, error: categoriasIdsError } = await supabase
    .from('anuncios')
    .select('*, categorias(id)')
    .eq('status', 'ativo')
    .not('categoria_id', 'is', null)
  
  
  if (categoriasIdsError) {
    console.error('[Feed] Erro ao buscar IDs de categorias com anúncios:', categoriasIdsError.message);
  }

  //const activeCategoryIds = categoriasComAnunciosIds?.map(item => item.categoria_id) || [];

  
  // 5. Busca categorias para o filtro
  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nome, icone, slug')
    .eq('ativo', true)
    .in('id', categoriasComAnunciosIds?.map(item => item.categoria_id) || [])
    .order('ordem', { ascending: true })
  
  console.log( '[Feed] IDs de categorias com anúncios:', categorias)
  
  return (
    <>
      <FirstFeedViewLogger />
      <FeedHeader
        nomeUsuario={perfil.nome}
        roleUsuario={perfil.role}
        nomeCondominio={
          Array.isArray(perfil.condominios)
            ? (perfil.condominios[0]?.nome ?? '')
            : (perfil.condominios?.nome ?? '')
        }
        countAnunciosRestantes={countAnunciosRestantes}
      />

      <main className="max-w-5xl mx-auto sm:px-4">

        {/* Carrossel de Banners Regionais */}
        {bannersNormalizados.length > 0 && (
          <div className="mb-2">
            <RegionalBannerCarousel banners={bannersNormalizados} />
          </div>
        )}

        <FiltroCategorias
          categorias={categorias ?? []}
          categoriaAtiva={categoriaFiltro ?? null}
        />

        {anunciosNormalizados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-4">📭</span>
            <p className="text-lg font-medium">Nenhum anúncio encontrado</p>
            <p className="text-sm mt-1">Seja o primeiro a anunciar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-6">
            {anunciosNormalizados.map((anuncio) => (
              <CardAnuncio key={anuncio.id} anuncio={anuncio} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}