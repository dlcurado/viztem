// components/landing/LandingCTAsClient.tsx
'use client';

import Link from 'next/link';
import { logEvent } from '@/lib/analytics';

interface LandingCTAsClientProps {
  finalCta?: boolean; // Propriedade opcional para diferenciar o CTA final
}

export function LandingCTAsClient({ finalCta = false }: LandingCTAsClientProps) {
  if (finalCta) {
    return (
      <>
        <Link
          href="/cadastro"
          onClick={() => logEvent('click_cta_cadastrar', { source: 'landing' })}
          className="px-10 py-4 bg-white text-emerald-700 font-bold rounded-xl text-base hover:bg-emerald-50 transition"
        >
          Criar minha conta gratuita
        </Link>
        <Link
          href="/login"
          onClick={() => logEvent('click_cta_acessar', { source: 'landing' })}
          className="text-emerald-200 text-sm hover:text-white transition underline underline-offset-4"
        >
          Já tenho conta? Entrar →
        </Link>
      </>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-2">
      <Link
        href="/cadastro"
        onClick={() => logEvent('click_cta_cadastrar', { source: 'landing_hero' })}
        className="px-8 py-4 bg-white text-emerald-700 font-bold rounded-xl text-base hover:bg-emerald-50 transition"
      >
        Quero participar
      </Link>
      <Link
        href="/login"
        onClick={() => logEvent('click_cta_acessar', { source: 'landing_hero' })}
        className="px-8 py-4 border border-white/40 text-white font-medium rounded-xl text-base hover:bg-white/10 transition"
      >
        Já tenho conta
      </Link>
    </div>
  );
}