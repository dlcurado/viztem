'use client'

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
        className="absolute top-2 right-2 z-10
                   bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm
                   hover:bg-green-50 hover:scale-110 transition-all duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4 text-green-500"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15
                   -.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075
                   -.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059
                   -.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52
                   .149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52
                   -.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51
                   -.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372
                   -.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074
                   .149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625
                   .712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413
                   .248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.523 5.847L.057 23.882
                   a.5.5 0 00.61.61l6.037-1.467A11.945 11.945 0 0012 24c6.627 0 12-5.373
                   12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.523-5.184-1.433l-.372-.223
                   -3.853.937.957-3.745-.244-.386A9.956 9.956 0 012 12C2 6.477 6.477 2
                   12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
      </button>
    )
  }

  // ── Variante completo — para a página de detalhe ──────────
  return (
    <button
      onClick={compartilhar}
      className="w-full flex items-center justify-center gap-2
                 border border-green-500 text-green-600
                 hover:bg-green-50 py-3 rounded-md text-base
                 font-semibold transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-5 h-5"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15
                 -.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075
                 -.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059
                 -.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52
                 .149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52
                 -.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51
                 -.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372
                 -.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074
                 .149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625
                 .712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413
                 .248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.523 5.847L.057 23.882
                 a.5.5 0 00.61.61l6.037-1.467A11.945 11.945 0 0012 24c6.627 0 12-5.373
                 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.523-5.184-1.433l-.372-.223
                 -3.853.937.957-3.745-.244-.386A9.956 9.956 0 012 12C2 6.477 6.477 2
                 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
      Compartilhar no WhatsApp
    </button>
  )
}