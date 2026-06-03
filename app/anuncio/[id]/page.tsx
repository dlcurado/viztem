import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import BotaoCompartilhar from '@/components/BotaoCompartilhar'
import DeleteAnuncioButton from '@/components/DeleteAnuncioButton' // Importado do seu arquivo

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
  autor: { // Renomeado de 'perfis' para 'autor' para corresponder ao alias no select
    id: string
    nome: string
    telefone: string | null
    bloco: string | null
    unidade: string | null
  } | null
  fotos: { id: string; url: string; ordem: number }[]
}

// ─── Helpers ──────────────────────────────────────────────────
function formatarPreco(preco: number | null, tipo: string): string {
  if (tipo === 'gratis') return '🎁 Grátis'
  if (tipo === 'negociavel' && !preco) return '💬 A combinar'
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
      descricao,
      preco,
      tipo_preco,
      fotos_anuncio ( url, ordem )
    `)
    .eq('id', id)
    .single()

  console.log('params:', params)
  console.log('id:', id)
  console.error('[Feed] Anúncio não encontrado:', anuncioError)
  console.error(`[Feed] Anúncio: ${anuncioRaw}`)

  if (!anuncioRaw) return { title: 'Anúncio não encontrado' }

  const fotos = [...(anuncioRaw.fotos_anuncio ?? [])].sort(
    (a, b) => a.ordem - b.ordem
  )
  const fotoCapa = fotos[0]?.url ?? null

  const precoTexto = formatarPreco(anuncioRaw.preco, anuncioRaw.tipo_preco ?? 'fixo')
  const descricaoOG = [precoTexto, anuncioRaw.descricao]
    .filter(Boolean)
    .join(' · ')

  
  return {
    title: anuncioRaw.titulo,
    description: descricaoOG,
    openGraph: {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/anuncio/${id}`,
      title: anuncioRaw.titulo,
      description: descricaoOG,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'Viztem',
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
      description: descricaoOG,
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
        .select('id, condominio_id, nome, telefone, bloco, unidade')
        .eq('id', user.id)
        .single()
        .then(({ data, error: perfilError }) => (perfilError ? null : data))
    : null

  const selectQuery: string = user
    ? `
      id, titulo, descricao, preco, tipo_preco,
      status, criado_em, expira_em, bloco, unidade,
      categorias ( nome, icone ),
      perfis ( id, nome, telefone, bloco, unidade ),
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

  console.log('params:', params)
  console.log('anuncioId:', anuncioId)
  console.error('[Feed] Anúncio não encontrado:', anuncioError)
  console.error(`[Feed] Anúncio: ${anuncioRaw}`)

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
    autor: (() => {
      const perfisRaw = anuncioRaw.perfis ?? null
      const p = Array.isArray(perfisRaw)
        ? perfisRaw[0]
        : perfisRaw
      return p
        ? { id: p.id, nome: p.nome, telefone: p.telefone,
            bloco: p.bloco, unidade: p.unidade }
        : null
    })(),
    fotos: (anuncioRaw.fotos_anuncio ?? []).sort(
      (a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem
    ),
  }

  const isOwner = user?.id === anuncio.autor?.id

  const fotosOrdenadas = anuncio.fotos.sort((a, b) => a.ordem - b.ordem)
  const fotoCapa = fotosOrdenadas[0]?.url ?? '/vercel.svg' // Fallback para imagem padrão

  const telVendedor = anuncio.autor?.telefone?.replace(/\D/g, '') || ''
  const mensagemWhatsApp = encodeURIComponent(
    `Olá! Tenho interesse no seu anúncio *"${anuncio.titulo}"* no Viztem! 🏘️\n\n` +
    `Meu nome é *${perfilUsuarioLogado?.nome ?? 'um morador'}*` +
    `${perfilUsuarioLogado?.bloco ? `, Bloco ${perfilUsuarioLogado.bloco}` : ''}` +
    `${perfilUsuarioLogado?.unidade ? `, Apto ${perfilUsuarioLogado.unidade}` : ''}.\n\n` +
    `Pode me chamar neste número: *${perfilUsuarioLogado?.telefone ?? 'não informado'}*`
  )
  const whatsappLink = `https://wa.me/55${telVendedor}?text=${mensagemWhatsApp}`

  return (
    <div className="min-h-screen bg-gray-50">
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

          {user && isOwner && (
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
                  {anuncio.expira_em && (
                    <li>
                      <span className="font-medium">Expira em:</span>{' '}
                      {formatarData(anuncio.expira_em)}
                    </li>
                  )}
                  <li>
                    <span className="font-medium">Status:</span>{' '}
                    <span className="capitalize">{anuncio.status}</span>
                  </li>
                </ul>
              </div>

              {anuncio.autor && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">Vendedor</h2>
                  <ul className="text-gray-700 space-y-1">
                    <li>
                      <span className="font-medium">Nome:</span> {anuncio.autor.nome}
                    </li>
                    {(anuncio.autor.bloco || anuncio.autor.unidade) && (
                      <li>
                        <span className="font-medium">Localização:</span>{' '}
                        {anuncio.autor.bloco && `Bloco ${anuncio.autor.bloco}`}
                        {anuncio.autor.bloco && anuncio.autor.unidade && ' · '}
                        {anuncio.autor.unidade && `Apto ${anuncio.autor.unidade}`}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              {!user ? (
                <Link
                  href={`/login?callbackUrl=/anuncio/${anuncio.id}`}
                  className="w-full inline-flex items-center justify-center gap-2
                             bg-emerald-500 hover:bg-emerald-600 text-white
                             py-3 rounded-md text-lg font-semibold transition-colors"
                >
                  Faça login para ver o contato
                </Link>
              ) : anuncio.autor?.telefone ? (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2
                               bg-green-500 hover:bg-green-600 text-white
                               py-3 rounded-md text-lg font-semibold transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 2a1 1 0 011 1v7h7a1 1 0 110 2h-7v7a1 1 0 11-2 0v-7H4a1 1 0 110-2h7V3a1 1 0 011-1z" />
                  </svg>
                  Tenho Interesse
                </a>
              ) : (
                <div className="w-full flex items-center justify-center gap-2
                                bg-gray-100 text-gray-400 py-3 rounded-md text-sm">
                  📵 Contato não disponível
                </div>
              )}

              {/* Compartilhar — visível para todos */}
              <BotaoCompartilhar
                id={anuncio.id}
                titulo={anuncio.titulo}
                preco={anuncio.preco}
                tipo_preco={anuncio.tipo_preco}
                descricao={anuncio.descricao}
                variant="completo"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}