import type { Metadata } from 'next'
import { PageViewLogger } from '@/components/analytics/PageViewLogger';
import { LandingCTAsClient } from '@/components/landing/LandingCTAsClient'; // Importe o novo Client Component para CTAs

export const metadata: Metadata = {
  title: 'VizTem · A vitrine de classificados do seu condomínio',
  description:
    'VizTem é o marketplace hiperlocal onde vizinhos compram, vendem e trocam entre si — com anúncios organizados, fotos e busca por categorias. Acesse pelo link, sem instalar nada.',
  openGraph: {
    title: 'VizTem · A vitrine de classificados do seu condomínio',
    description:
      'Encontre e anuncie produtos e serviços dentro do seu condomínio. Organizado, com busca e sem ruído.',
    siteName: 'VizTem',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      <PageViewLogger page="landing" />
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div className="max-w-3xl mx-auto px-6 py-20 flex flex-col items-center text-center gap-6">

          {/* Logo / nome */}
          <span className="text-sm font-semibold tracking-widest uppercase text-emerald-200">
            VizTem
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
            A vitrine de classificados<br />do seu condomínio.
          </h1>

          <p className="text-lg sm:text-xl text-emerald-100 max-w-xl">
            O lugar onde seus vizinhos anunciam o que têm para vender,
            trocar ou oferecer — organizado, com busca por categorias
            e acesso direto pelo link. Sem instalar nada.
          </p>

          {/* Os botões de CTA agora são um Client Component */}
          <LandingCTAsClient />
        </div>
      </section>

      {/* ── PROBLEMA ─────────────────────────────────────────── */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-4">
            O problema que resolvemos
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            Grupos de conversa foram feitos para conversar.
          </h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Classificados misturados com avisos, reclamações e mensagens do
            dia a dia fazem com que boas oportunidades passem despercebidas.
            Quando você vê, o anúncio já sumiu no histórico e o negócio foi
            embora.
            <br /><br />
            No VizTem, classificados ficam onde devem estar — em uma vitrine
            organizada, acessível a qualquer hora.
          </p>
        </div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-4 text-center">
            Como funciona
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-10 text-center">
            Simples do começo ao fim.
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                step: '1',
                icon: '🔑',
                title: 'Acesse com o código do seu condomínio',
                desc: 'Seguro, rápido e sem precisar instalar nenhum aplicativo.',
              },
              {
                step: '2',
                icon: '🔍',
                title: 'Explore o que seu condomínio tem',
                desc: 'Veja anúncios por categoria, use a busca e encontre o que precisa em segundos.',
              },
              {
                step: '3',
                icon: '📸',
                title: 'Publique seus anúncios com fotos',
                desc: 'Crie uma vitrine clara do que você vende ou oferece, com até 3 fotos por anúncio.',
              },
              {
                step: '4',
                icon: '💬',
                title: 'Fale direto com o vizinho',
                desc: 'O contato é simples, próximo e de confiança — você e seu vizinho, sem intermediários.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-4 bg-gray-50 rounded-2xl p-5 border border-gray-100"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  {item.step}
                </div>
                <div>
                  <p className="text-lg mb-1">{item.icon}</p>
                  <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA QUEM VENDE ──────────────────────────────────── */}
      <section className="bg-emerald-50 border-b border-emerald-100">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-4 text-center">
            Para quem vende ou presta serviços
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-10 text-center">
            Seu anúncio não some mais.
          </h2>

          <div className="flex flex-col gap-5">
            {[
              {
                icon: '🏪',
                title: 'Vitrine sempre disponível',
                desc: 'Todos os seus produtos e serviços em um só lugar, com fotos, descrição e categoria.',
              },
              {
                icon: '👁️',
                title: 'Visibilidade real no condomínio',
                desc: 'Quem busca aquela categoria encontra você — mesmo dias depois que publicou.',
              },
              {
                icon: '🤝',
                title: 'Contato qualificado',
                desc: 'Quem chega até você já é vizinho, já viu o produto e já quer negociar.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm"
              >
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA QUEM BUSCA ──────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-4 text-center">
            Para quem busca ou compra
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-10 text-center">
            Encontre o que precisa sem precisar perguntar.
          </h2>

          <div className="flex flex-col gap-5">
            {[
              {
                icon: '🔍',
                title: 'Busca por categoria',
                desc: 'Diarista, psicólogo, celular usado, bolo — em segundos, sem depender da memória de ninguém.',
              },
              {
                icon: '🏘️',
                title: 'Compre de quem você conhece',
                desc: 'Vizinhos. Dentro do condomínio. Mais segurança, mais conveniência.',
              },
              {
                icon: '✨',
                title: 'Tudo em um só lugar',
                desc: 'Uma visão clara de tudo que o seu condomínio tem para oferecer, sem garimpar histórico.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 bg-gray-50 rounded-2xl p-5 border border-gray-100"
              >
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIFERENCIAIS ─────────────────────────────────────── */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-4 text-center">
            Por que não é só mais um grupo?
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-10 text-center">
            Não é grupo. É vitrine.
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '🗂️', text: 'Classificados separados de conversa' },
              { icon: '🔎', text: 'Busca, filtros e histórico sempre disponíveis' },
              { icon: '📸', text: 'Anúncios com fotos e descrição organizada' },
              { icon: '🔒', text: 'Acesso restrito ao condomínio — só quem mora lá entra' },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 bg-white rounded-xl px-5 py-4 border border-gray-100 shadow-sm"
              >
                <span className="text-xl">{item.icon}</span>
                <p className="text-gray-700 text-sm font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section className="bg-emerald-700 text-white">
        <div className="max-w-3xl mx-auto px-6 py-20 flex flex-col items-center text-center gap-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            Seu condomínio já pode ter isso.
          </h2>
          <p className="text-emerald-100 text-base sm:text-lg max-w-xl">
            Cadastre-se agora com o código do seu condomínio e comece a usar
            o VizTem hoje. Gratuito para moradores.
          </p>
          {/* Os botões de CTA final também são um Client Component */}
          <LandingCTAsClient finalCta={true} />
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-500 text-center text-xs py-6 px-4">
        © {new Date().getFullYear()} VizTem · Marketplace hiperlocal de condomínios
      </footer>

    </main>
  )
}