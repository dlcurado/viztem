import Link from 'next/link'

type Props = {
  nomeUsuario: string
  nomeCondominio: string
  countAnunciosRestantes: number
}

export default function FeedHeader({ nomeUsuario, nomeCondominio, countAnunciosRestantes }: Props) {
  // Pegar apenas o primeiro nome
  const primeiroNome = nomeUsuario.split(' ')[0]
  const podePublicar = countAnunciosRestantes > 0;

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
        href={podePublicar ? '/novo-anuncio' : '#'} // Sintaxe correta para href
        className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition shadow-sm
          ${podePublicar
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-600 cursor-not-allowed' // Estilo para desabilitado
          }`}
        aria-disabled={!podePublicar} // Boa prática de acessibilidade
        onClick={(e) => {
          if (!podePublicar) {
            e.preventDefault(); // Impede a navegação se o limite for atingido
            // Opcional: mostrar um toast ou alerta para o usuário
            alert('Você atingiu o limite de 5 anúncios ativos. Edite ou exclua um anúncio existente para publicar um novo.');
          }
        }}
      >
        <span className="text-base leading-none">+</span>
        {podePublicar ? 'Publicar' : 'Limite atingido'}
      </Link>
    </div>
  )
}