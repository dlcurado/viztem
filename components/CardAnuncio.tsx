'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { AnuncioComDetalhes } from '@/app/(app)/feed/page'
import BotaoCompartilhar from '@/components/BotaoCompartilhar'

type Props = {
  anuncio: AnuncioComDetalhes
}

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

export default function CardAnuncio({ anuncio }: Props) {
  console.log('Renderizando CardAnuncio:', anuncio);
  const precoFormatado = formatarPreco(anuncio.preco, anuncio.tipo_preco)
  
  return (
    <Link
      href={`/anuncio/${anuncio.id}`}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden
                 hover:shadow-md hover:border-gray-200 transition-all duration-200"
    >
      {/* Foto de capa */}
      <div className="relative w-full h-44 bg-gray-100">
        {anuncio.foto_capa ? (
          <Image
            src={anuncio.foto_capa}
            alt={anuncio.titulo}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300 text-4xl">
            {anuncio.categoria?.icone ?? '📦'}
          </div>
        )}

        {/* Badge de categoria — canto superior esquerdo */}
        {anuncio.categoria && (
          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm
                           text-xs font-medium text-gray-700 px-2 py-1 rounded-full shadow-sm">
            {anuncio.categoria.icone} {anuncio.categoria.nome}
          </span>
        )}

        {/* Botão compartilhar — canto superior direito */}
        <BotaoCompartilhar
          id={anuncio.id}
          //titulo={anuncio.titulo}
          descricao={anuncio.descricao}
          tipo_preco={anuncio.tipo_preco}
          preco={anuncio.preco}
          ad_whatsapp={anuncio.contact_whatsapp} // TODO: Definir se o campo é do anúncio (ad_) ou do proprietário (contact_)
          ad_url={anuncio.contact_url} // TODO: Definir se o campo é do anúncio (ad_) ou do proprietário (contact_)
          variant="icone"
        />
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-1">
        <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {anuncio.titulo}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-3">{anuncio.descricao}</p>
        <p className="text-base font-bold text-emerald-600 pt-1">{precoFormatado}</p>
      </div>
    </Link>
  )
}