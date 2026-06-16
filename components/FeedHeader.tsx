'use client';

import Link from 'next/link'
import { logEvent } from '@/lib/analytics'; // Importar logEvent para o onClick

type Props = {
  nomeUsuario: string
  roleUsuario: string
  nomeCondominio: string
  countAnunciosRestantes: number
}

export default function FeedHeader({ nomeUsuario, roleUsuario, nomeCondominio, countAnunciosRestantes }: Props) {
  // Pegar apenas o primeiro nome
  const primeiroNome = nomeUsuario.split(' ')[0]
  const podePublicar = countAnunciosRestantes > 0 || roleUsuario === 'admin';

  return (
    <div className="flex items-center justify-between py-4 sm:px-4 mb-2">
      <div>
        <h2 className="text-xl font-bold text-gray-dark">
          Olá, {primeiroNome}!
        </h2>
        <p className="text-sm text-gray-medium mt-0.5">
          {nomeCondominio}
        </p>
      </div>

      {/* Botão publicar */}
      <Link
        href={podePublicar ? '/novo-anuncio' : '#'}
        className={`
          flex items-center justify-center
          w-10 h-10 rounded-lg
          transition shadow-sm
          ${podePublicar
            ? 'bg-primary text-white hover:bg_blue-700'
            : 'bg-gray-300 text-gray-medium cursor-not-allowed'
          }`}
        arial-label={podePublicar ? 'Publicar novo anúncio' : 'Limite de anúncios atingido'}
        aria-disabled={!podePublicar}
        onClick={(e) => {
          if (!podePublicar) {
            e.preventDefault(); // Impede a navegação se o limite for atingido
            // Opcional: mostrar um toast ou alerta para o usuário
            alert('Você atingiu o limite de 5 anúncios ativos. Edite ou exclua um anúncio existente para publicar um novo.');
          } else {
            // Logar o evento de clique no botão de publicar
            logEvent('click_publicar_anuncio', { status: 'permitido' });
          }
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5} // Aumenta a espessura da linha para parecer mais sólido
          stroke="currentColor"
          className="w-6 h-6" // Tamanho do ícone
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </Link>
    </div>
  )
}