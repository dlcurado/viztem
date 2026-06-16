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
      router.push('/feed')
    } else {
      router.push(`/feed?categoria=${slug}`)
    }
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-5 scrollbar-hide sm:px-4">
      <button
        onClick={() => handleClick(null)}
        className={`flex-shrink-0 flex items-center justify-center gap-1.5 
          h-9 px-4 rounded-full text-sm font-medium transition-all
          ${categoriaAtiva === null
            ? 'bg-primary text-white shadow-sm'
            : 'bg-card-bg text-gray-medium border border-gray-300 hover:border-primary'
          }`}
      >
        Todos
      </button>

      {categorias.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => handleClick(cat.slug)}
          className={`flex-shrink-0 flex items-center justify-center gap-1.5
            h-9 px-4 rounded-full text-sm font-medium transition-all
            ${categoriaAtiva === cat.slug
              ? 'bg-primary text-white shadow-sm'
              : 'bg-card-bg text-gray-medium border border-gray-300 hover:border-primary'
            }`}
        >
          {cat.icone && <span className="mr-1">{cat.icone}</span>}
          {cat.nome}
        </button>
      ))}
    </div>
    
  )
}