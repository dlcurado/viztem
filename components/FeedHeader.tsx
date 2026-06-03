import Link from 'next/link'

type Props = {
  nomeUsuario: string
  nomeCondominio: string
  countAnunciosRestantes: number
}

export default function FeedHeader({ nomeUsuario, nomeCondominio, countAnunciosRestantes }: Props) {
  // Pegar apenas o primeiro nome
  const primeiroNome = nomeUsuario.split(' ')[0]

  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Olá, {primeiroNome}! 👋
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          📍 {nomeCondominio}
        </p>
      </div>

      {/* Botão publicar */}
      <Link
        href="{countAnunciosRestantes > 0 ? '/novo-anuncio' : '#'}"
        className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-blue-700 transition shadow-sm"
      >
        <span className="text-base leading-none">+</span>
        {countAnunciosRestantes > 0 ? 'Publicar' : 'Limite de anúncios atingido'}
      </Link>
    </div>
  )
}