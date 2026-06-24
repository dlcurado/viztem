'use client'

import Icone from '@/public/icone.svg';

interface Props {
  id: string
  //titulo: string
  preco: number | null
  tipo_preco: string
  descricao?: string | null
  ad_whatsapp?: string | null
  ad_url?: string | null
  variant?: 'icone' | 'completo'  // icone = card | completo = detalhe
}

export default function BotaoCompartilhar({
  id,
  //titulo,
  descricao,
  tipo_preco,
  preco,
  ad_whatsapp,
  ad_url,
  variant = 'icone',
}: Props) {

  function formatarPrecoTexto(): string {
    if (tipo_preco === 'gratis') return '🎁 Grátis'
    if (tipo_preco === 'negociavel' && !preco) return 'A combinar'
    if (!preco) return ''
    return `R$ ${preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }

  function compartilhar(e: React.MouseEvent) {
    // Impede que o clique navegue para o anúncio (quando está no card)
    e.preventDefault()
    e.stopPropagation()

    const url = `${window.location.origin}/anuncio/${id}`

    console.log(ad_whatsapp, ad_url);
    
    const linhas = [
      //`🏷️ *${titulo}*`,
      descricao ? `📝 ${descricao}` : null,
      ``,
      formatarPrecoTexto() ? `💰 ${formatarPrecoTexto()}` : null,
      ``,
      `👉 Ver anúncio completo:`,
      url,
      ``,
      ad_whatsapp ? `📞 WhatsApp: ${ad_whatsapp}` : null, '',
      ad_url ? `🌐 ${ad_url}` : null, ``,
      `_Viztem · Marketplace do seu condomínio_ 🏘️`,
    ]

    const texto = linhas.filter((l) => l !== null).join('\n')
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(urlWhatsApp, '_blank')
  }

  // ── Variante ícone — para o card do feed ─────────────────
  if (variant === 'icone') {
    return (
      <button
        onClick={compartilhar}
        title="Compartilhar no WhatsApp"
        className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm
          hover:bg-green-50 hover:scale-110 transition-all duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="2 2 18 18"
          fill="currentColor"
          className="w-6 h-6 text-slate-600"
        >
          <path d="M17.145 14.04 8.73 10.8l8.415 -3.24c0.675 -0.27 1.035 -1.035 0.765 -1.755 -0.27 -0.675 -1.035 -1.035 -1.755 -0.765l-11.7 4.5C3.96 9.72 3.6 10.26 3.6 10.8s0.36 1.08 0.855 1.26l11.7 4.5c0.18 0.045 0.315 0.09 0.495 0.09 0.54 0 1.035 -0.315 1.26 -0.855 0.27 -0.72 -0.09 -1.485 -0.765 -1.755"/>
          <g>
            <path cx="11" cy="24" r="7" d="M8.1 10.8A3.15 3.15 0 0 1 4.95 13.95A3.15 3.15 0 0 1 1.8 10.8A3.15 3.15 0 0 1 8.1 10.8z"/>
            <path cx="37" cy="14" r="7" d="M19.8 6.3A3.15 3.15 0 0 1 16.65 9.45A3.15 3.15 0 0 1 13.5 6.3A3.15 3.15 0 0 1 19.8 6.3z"/>
            <path cx="37" cy="34" r="7" d="M19.8 15.3A3.15 3.15 0 0 1 16.65 18.45A3.15 3.15 0 0 1 13.5 15.3A3.15 3.15 0 0 1 19.8 15.3z"/></g>
        </svg>
      </button>
    )
  }

  // ── Variante completo — para a página de detalhe ──────────
  return (
    <button
      onClick={compartilhar}
      className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm
          hover:bg-green-50 hover:scale-110 transition-all duration-200"
    >
      <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 28 28"
          fill="currentColor"
          className="w-10 h-10 text-slate-600"
        >
          <path d="M20.002 16.38 10.185 12.6l9.818 -3.78a1.575 1.575 0 0 0 0.893 -2.047 1.575 1.575 0 0 0 -2.047 -0.893l-13.65 5.25c-0.578 0.21 -0.997 0.84 -0.997 1.47s0.42 1.26 0.997 1.47l13.65 5.25c0.21 0.052 0.367 0.105 0.578 0.105a1.575 1.575 0 0 0 1.47 -0.997 1.575 1.575 0 0 0 -0.893 -2.047"/>
          <g>
            <path cx="11" cy="24" r="7" d="M9.45 12.6a3.675 3.675 0 0 1 -3.675 3.675 3.675 3.675 0 0 1 -3.675 -3.675 3.675 3.675 0 0 1 7.35 0"/>
            <path cx="37" cy="14" r="7" d="M23.1 7.35a3.675 3.675 0 0 1 -3.675 3.675A3.675 3.675 0 0 1 15.75 7.35a3.675 3.675 0 0 1 7.35 0"/>
            <path cx="37" cy="34" r="7" d="M23.1 17.85a3.675 3.675 0 0 1 -3.675 3.675 3.675 3.675 0 0 1 -3.675 -3.675 3.675 3.675 0 0 1 7.35 0"/>
          </g>
        </svg>
    </button>
  )
}