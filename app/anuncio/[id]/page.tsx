import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import BotaoCompartilhar from '@/components/BotaoCompartilhar'
import DeleteAnuncioButton from '@/components/DeleteAnuncioButton' // Importado do seu arquivo
import { EventLogger } from '@/components/analytics/EventLogger'
import { WhatsAppContactButton } from '@/components/analytics/WhatsAppContactButton'
import { UrlContactButton } from '@/components/analytics/UrlContactButton'

// ─── Tipagem ──────────────────────────────────────────────────
// Mantendo a tipagem do seu arquivo original, com pequenas correções para o join
export type AnuncioDetalhado = {
  id: string
  titulo: string
  descricao: string | null // Pode ser null
  preco: number | null
  tipo_preco: 'fixo' | 'negociavel' | 'gratis'
  status: string
  criado_em: string
  expira_em: string | null
  bloco: string | null
  unidade: string | null
  categoria: { nome: string; icone: string | null } | null // icone pode ser null
  created_by_user_id: string
  autor: {
    id: string
    nome: string
    telefone: string | null
    bloco: string | null
    unidade: string | null
  } | null
  owner_user_id: string
  owner: { // Renomeado de 'perfis' para 'owner' para corresponder ao alias no select
    id: string
    nome: string
    telefone: string | null
    bloco: string | null
    unidade: string | null
  } | null
  contact_whatsapp: string | null
  contact_url: string | null
  fotos: { id: string; url: string; ordem: number }[]
}

// ─── Helpers ──────────────────────────────────────────────────
function formatarPreco(preco: number | null, tipo: string): string {
  if (tipo === 'gratis') return '🎁 Grátis'
  if (tipo === 'negociavel' && !preco) return '💬 Variável'
  if (!preco) return '—'
  const valor = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(preco)
  return tipo === 'negociavel' ? `${valor} (negociável)` : valor
}

function formatarData(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

// ─── Open Graph ───────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const supabase = await createClient()
  const { id } = await Promise.resolve(params)

  const { data: anuncioRaw, error: anuncioError} = await supabase
    .from('anuncios')
    .select(`
      titulo,
      fotos_anuncio ( url, ordem )
    `)
    .eq('id', id)
    .single()

  if (!anuncioRaw) return { title: 'Anúncio não encontrado' }

  const fotos = [...(anuncioRaw.fotos_anuncio ?? [])].sort(
    (a, b) => a.ordem - b.ordem
  )
  const fotoCapa = fotos[0]?.url ?? null

  return {
    title: anuncioRaw.titulo,
    openGraph: {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/anuncio/${id}`,
      title: anuncioRaw.titulo,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'VizTem',
      ...(fotoCapa && {
        images: [{
          url: fotoCapa,
          width: 1200,
          height: 630,
          alt: anuncioRaw.titulo,
        }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: anuncioRaw.titulo,
      ...(fotoCapa && { images: [fotoCapa] }),
    },
  }
}

// ─── Página ───────────────────────────────────────────────────
export default async function AnuncioDetalhePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { id: anuncioId } = await Promise.resolve(params)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const perfilUsuarioLogado = user
    ? await supabase
        .from('perfis')
        .select('id, condominio_id, nome, telefone, bloco, unidade, role')
        .eq('id', user.id)
        .single()
        .then(({ data, error: perfilError }) => (perfilError ? null : data))
    : null

  const selectQuery: string = user
    ? `
      id, titulo, descricao, preco, tipo_preco,
      status, criado_em, expira_em, bloco, unidade, created_by_user_id, owner_user_id,
      contact_whatsapp, contact_url,
      categorias ( nome, icone ),
      autor:created_by_user_id ( id, nome, telefone, bloco, unidade ),
      owner:owner_user_id ( id, nome, telefone, bloco, unidade ),
      fotos_anuncio ( id, url, ordem )
    `
    : `
      id, titulo, descricao, preco, tipo_preco,
      status, criado_em, expira_em, bloco, unidade,
      categorias ( nome, icone ),
      fotos_anuncio ( id, url, ordem )
    `

  // Busca o anúncio
  const { data: anuncioRaw, error: anuncioError } = (await supabase
    .from('anuncios')
    .select(selectQuery as string)
    .eq('id', anuncioId)
    .single()) as { data: any; error: any }

  console.log('User role:', perfilUsuarioLogado?.role)

  if(anuncioError) console.log('[Feed] Anúncio não encontrado:', anuncioError)

  // Se o anúncio não for encontrado, redireciona para o feed (ou 404)
  if (anuncioError || !anuncioRaw) {
    redirect('/feed') // Ou para uma página 404 personalizada
  }

  // Mapeia para o tipo AnuncioDetalhado
  const anuncio: AnuncioDetalhado = {
    id: anuncioRaw.id,
    titulo: anuncioRaw.titulo,
    descricao: anuncioRaw.descricao,
    preco: anuncioRaw.preco,
    tipo_preco: anuncioRaw.tipo_preco as 'fixo' | 'negociavel' | 'gratis', // Type assertion
    status: anuncioRaw.status,
    criado_em: anuncioRaw.criado_em,
    expira_em: anuncioRaw.expira_em,
    bloco: anuncioRaw.bloco,
    unidade: anuncioRaw.unidade,
    categoria: Array.isArray(anuncioRaw.categorias)
      ? anuncioRaw.categorias[0] ?? null
      : anuncioRaw.categorias ?? null,
    created_by_user_id: anuncioRaw.created_by_user_id,
    autor: (() => {
      const p = Array.isArray(anuncioRaw.autor) ? anuncioRaw.autor[0] : anuncioRaw.autor
      return p ? { id: p.id, nome: p.nome, telefone: p.telefone, bloco: p.bloco, unidade: p.unidade } : null
    })(),

    owner_user_id: anuncioRaw.owner_user_id,
    owner: (() => {
      const p = Array.isArray(anuncioRaw.owner) ? anuncioRaw.owner[0] : anuncioRaw.owner
      return p ? { id: p.id, nome: p.nome, telefone: p.telefone, bloco: p.bloco, unidade: p.unidade } : null
    })(),

    contact_whatsapp: anuncioRaw.contact_whatsapp ?? '',
    contact_url: anuncioRaw.contact_url ?? '',
    fotos: (anuncioRaw.fotos_anuncio ?? []).sort(
      (a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem
    ),
  }

  const isOwner = user?.id === anuncio.autor?.id
  const isAdmin = perfilUsuarioLogado?.role === 'admin'

  const fotosOrdenadas = anuncio.fotos.sort((a, b) => a.ordem - b.ordem)
  const fotoCapa = fotosOrdenadas[0]?.url ?? '/vercel.svg' // Fallback para imagem padrão

  const telAnuncio = anuncio.contact_whatsapp?.replace(/\D/g, '') || ''
  const urlAnuncio = anuncio.contact_url || undefined
  const mensagemWhatsApp = encodeURIComponent(
    `Olá! Tenho interesse no seu anúncio *"${anuncio.titulo}"* no Viztem! 🏘️\n\n` +
    `Meu nome é *${perfilUsuarioLogado?.nome ?? 'um morador'}*` +
    `${perfilUsuarioLogado?.bloco ? `, Bloco ${perfilUsuarioLogado.bloco}` : ''}` +
    `${perfilUsuarioLogado?.unidade ? `, Apto ${perfilUsuarioLogado.unidade}` : ''}.\n\n` +
    `Pode me chamar neste número: *${perfilUsuarioLogado?.telefone ?? 'não informado'}*`
  )
  
  const whatsappLink = telAnuncio ? `https://wa.me/55${telAnuncio}?text=${mensagemWhatsApp}` : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <EventLogger eventName="ad_view" payload={
        { page: "ad_view", 
          ad_id: anuncio.id, 
          user_id: user?.id ?? null, 
          condominio_id: perfilUsuarioLogado?.condominio_id ?? null }
        } />
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href={user ? '/feed' : '/'}
            className="text-emerald-600 hover:text-emerald-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1"
              viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0
                   01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd" />
            </svg>
            Voltar ao Feed
          </Link>

          {user && (isOwner || isAdmin) && (
            <div className="flex space-x-2">
              <Link
                href={`/anuncio/${anuncio.id}/editar`}
                className="px-3 py-1.5 text-sm font-medium text-blue-700
                           bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
              >
                Editar
              </Link>
              <DeleteAnuncioButton anuncioId={anuncio.id} />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">

          {/* Foto */}
          <div className="relative w-full h-64 sm:h-80 bg-gray-200 flex items-center justify-center">
            {anuncio.fotos.length > 0 ? (
              <Image
                src={fotoCapa}
                alt={anuncio.titulo}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="text-gray-400 text-6xl">
                {anuncio.categoria?.icone ?? '📦'}
              </div>
            )}
          </div>

          {/* Conteúdo */}
          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {anuncio.titulo}
              </h1>
              <p className="text-2xl font-extrabold text-emerald-600">
                {formatarPreco(anuncio.preco, anuncio.tipo_preco)}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Descrição</h2>
              <p className="text-gray-700 whitespace-pre-line">{anuncio.descricao}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Detalhes</h2>
                <ul className="text-gray-700 space-y-1">
                  <li>
                    <span className="font-medium">Categoria:</span>{' '}
                    {anuncio.categoria?.icone} {anuncio.categoria?.nome}
                  </li>
                  <li>
                    <span className="font-medium">Publicado em:</span>{' '}
                    {formatarData(anuncio.criado_em)}
                  </li>
                  {/*anuncio.expira_em && (
                    <li>
                      <span className="font-medium">Expira em:</span>{' '}
                      {formatarData(anuncio.expira_em)}
                    </li>
                  )*/}
                  <li>
                    <span className="font-medium">Status:</span>{' '}
                    <span className="capitalize">{anuncio.status}</span>
                  </li>
                </ul>
              </div>

              {anuncio.owner && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">Vendedor</h2>
                  <ul className="text-gray-700 space-y-1">
                    <li>
                      <span className="font-medium">Nome:</span> {anuncio.owner.nome}
                    </li>
                    {(anuncio.owner.bloco || anuncio.owner.unidade) && (
                      <li>
                        <span className="font-medium">Localização:</span>{' '}
                        {anuncio.owner.bloco && `Bloco ${anuncio.owner.bloco}`}
                        {anuncio.owner.bloco && anuncio.owner.unidade && ' · '}
                        {anuncio.owner.unidade && `Apto ${anuncio.owner.unidade}`}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <WhatsAppContactButton
                user={user}
                anuncioId={anuncio.id}
                whatsappLink={whatsappLink}
                anuncioHasPhone={anuncio.contact_whatsapp ? true : false  }
              />

              {urlAnuncio && (
                <UrlContactButton
                  user={user}
                  anuncioId={anuncio.id}
                  url={urlAnuncio}
                />
              )}

              {/* Compartilhar — visível para todos */}
              <BotaoCompartilhar
                id={anuncio.id}
                //titulo={anuncio.titulo}
                descricao={anuncio.descricao}
                tipo_preco={anuncio.tipo_preco}
                preco={anuncio.preco}
                ad_whatsapp={anuncio.contact_whatsapp}
                ad_url={anuncio.contact_url}
                variant="completo"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}