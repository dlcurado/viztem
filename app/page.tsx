import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const { data: categorias, error } = await supabase
    .from('categorias')
    .select('nome, slug, icone')
    .order('ordem')

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-red-500 text-xl font-bold">❌ Erro na conexão</h1>
        <p className="text-gray-600 mt-2">{error.message}</p>
      </main>
    )
  }

  return (
    <main className="p-8">
      <h1 className="text-green-600 text-xl font-bold">
        ✅ Supabase conectado!
      </h1>
      <p className="text-gray-500 mt-1 mb-4">
        Categorias encontradas no banco:
      </p>
      <ul className="space-y-2">
        {categorias.map((cat) => (
          <li
            key={cat.slug}
            className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg"
          >
            <span className="text-2xl">{cat.icone}</span>
            <span className="font-medium">{cat.nome}</span>
            <span className="text-gray-400 text-sm">({cat.slug})</span>
          </li>
        ))}
      </ul>
    </main>
  )
}