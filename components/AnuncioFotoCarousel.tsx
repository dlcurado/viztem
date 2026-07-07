// components/CarrosselFotos.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'

type Foto = {
  id: string
  url: string
  ordem: number
}

type Props = {
  fotos: Foto[]
  tituloAnuncio: string
}

export default function CarrosselFotos({ fotos, tituloAnuncio }: Props) {
  const [fotoCapaUrl, setFotoCapaUrl] = useState<string>(
    fotos[0]?.url ?? '/placeholder.svg'
  )

  if (fotos.length === 0) return null

  return (
    <div className="w-full">

      {/* ── Foto principal (capa) ─────────────────────── */}
      <div className="relative w-full h-64 sm:h-80 bg-gray-100">
        <Image
          src={fotoCapaUrl}
          alt={tituloAnuncio}
          fill
          className="object-cover transition-opacity duration-200"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
        />
      </div>

      {/* ── Miniaturas (só aparece se tiver mais de 1 foto) ── */}
      {fotos.length > 1 && (
        <div className="flex gap-2 mt-2 px-2">
          {fotos.map((foto) => (
            <button
              key={foto.id}
              type="button"
              onClick={() => setFotoCapaUrl(foto.url)}
              className={`
                relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0
                transition-all duration-150
                ${fotoCapaUrl === foto.url
                  ? 'border-blue-500 opacity-100 scale-105'  // Ativa
                  : 'border-transparent opacity-60 hover:opacity-90' // Inativa
                }
              `}
              aria-label={`Ver foto ${foto.ordem}`}
            >
              <Image
                src={foto.url}
                alt={`Miniatura ${foto.ordem}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

    </div>
  )
}