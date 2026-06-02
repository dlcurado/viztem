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
  const { id } = params

  const { data } = await supabase
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

  if (!data) return { title: 'Anúncio não encontrado' }

  const fotos = [...(data.fotos_anuncio ?? [])].sort(
    (a: any, b: any) => a.ordem - b.ordem
  )
  const fotoCapa = fotos[0]?.url ?? null

  const precoTexto = formatarPreco(data.preco, data.tipo_preco ?? 'fixo')
  const descricaoOG = [precoTexto, data.descricao]
    .filter(Boolean)
    .join(' · ')

  return {
    title: data.titulo,
    description: descricaoOG,
    openGraph: {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/anuncio/${id}`,
      title: data.titulo,
      description: descricaoOG,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'Viztem',
      ...(fotoCapa && {
        images: [{
          url: fotoCapa,
          width: 1200,
          height: 630,
          alt: data.titulo,
        }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: data.titulo,
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
  const { id: anuncioId } = params

  // O proxy.ts já garante que o usuário está autenticado para chegar aqui.
  // Se não estiver, ele já foi redirecionado para /login.
  const {
    data: { user },
    error: authError, // authError não deve ocorrer se o user existir
  } = await supabase.auth.getUser()

  // Se por alguma falha o user não existir aqui, redireciona para login.
  // Isso é uma salvaguarda, mas o proxy.ts deve evitar que chegue aqui.
  if (!user) {
    redirect(`/login?callbackUrl=/anuncio/${anuncioId}`);
  }

  // Busca perfil do usuário logado
  const perfilUsuarioLogado = await supabase
    .from('perfis')
    .select('id, condominio_id, nome, telefone, bloco, unidade')
    .eq('id', user.id)
    .single()
    .then(({ data, error: perfilError }) => (perfilError ? null : data))

  // Busca o anúncio
  const { data: anuncioRaw, error: anuncioError } = await supabase
    .from('anuncios')
    .select(`
      id, titulo, descricao, preco, tipo_preco,
      status, criado_em, expira_em, bloco, unidade,
      categorias ( nome, icone ),
      perfis ( id, nome, telefone, bloco, unidade ),
      fotos_anuncio ( id, url, ordem )
    `)
    .eq('id', anuncioId)
    .single()

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
      const p = Array.isArray(anuncioRaw.perfis)
        ? anuncioRaw.perfis[0]
        : anuncioRaw.perfis
      return p
        ? { id: p.id, nome: p.nome, telefone: p.telefone,
            bloco: p.bloco, unidade: p.unidade }
        : null
    })(),
    fotos: (anuncioRaw.fotos_anuncio ?? []).sort(
      (a: any, b: any) => a.ordem - b.ordem
    ),
  }

  const isOwner = user.id === anuncio.autor?.id

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
            href="/feed" // Sempre volta para o feed, pois o usuário está logado
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

          {isOwner && (
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
              {anuncio.autor?.telefone ? (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2
                                 bg-green-500 hover:bg-green-600 text-white
                                 py-3 rounded-md text-lg font-semibold transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                    fill="currentColor" className="w-5 h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967
                                 -.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164
                                 -.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475
                                 -.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606
                                 .134-.133.298-.347.446-.52.149-.174.198-.298.298-.497
                                 .099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207
                                 -.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01
                                 -.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479
                                 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487
                                 .709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118
                                 .571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413
                                 -.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.121 1.532 5.856
                                 L.057 23.25a.75.75 0 00.916.932l5.453-1.43A11.945 11.945 0
                                 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.694
                                 9.694 0 01-4.983-1.378l-.358-.214-3.706.972.99-3.614-.234-.373
                                 A9.712 9.712 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75
                                 6.615 21.75 12 17.385 21.75 12 21.75z"/>
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