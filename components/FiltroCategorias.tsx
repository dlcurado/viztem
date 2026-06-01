'use client'

import { useRouter } from 'next/navigation'

type Categoria = {
  id: string
  nome: string
  icone: string
  slug: string
}

type Props = {
  categorias: Categoria[]
  categoriaAtiva: string | null
}

export default function FiltroCategorias({
  categorias,
  categoriaAtiva,
}: Props) {
  const router = useRouter()

  function handleClick(slug: string | null) {
    if (slug === null) {
      router.push('/feed')
    } else if (slug === categoriaAtiva) {
      // Clicou na categoria ativa → remove filtro
      router.push('/feed')
    } else {
      router.push(`/feed?categoria=${slug}`)
    }
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => handleClick(null)}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5
          rounded-full text-xs font-medium transition-all
          ${categoriaAtiva === null
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
          }`}
      >
        🏘️ Todos
      </button>

      {categorias.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => handleClick(cat.slug)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5
            rounded-full text-xs font-medium transition-all
            ${categoriaAtiva === cat.slug
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
            }`}
        >
          {cat.icone} {cat.nome}
        </button>
      ))}
    </div>
  )
}