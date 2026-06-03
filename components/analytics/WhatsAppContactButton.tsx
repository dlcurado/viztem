// components/anuncios/WhatsAppContactButton.tsx
'use client';

import { logEvent } from '@/lib/analytics';
import Link from 'next/link'

interface WhatsAppContactButtonProps {
  user: any; // Você pode substituir 'any' pelo tipo do usuário que você tem no seu projeto
  anuncioId: string;
  whatsappLink: string;
  userHasPhone: boolean; // Indica se o usuário logado tem telefone para a mensagem
}

export function WhatsAppContactButton({ user, anuncioId, whatsappLink, userHasPhone }: WhatsAppContactButtonProps) {
  if(!user){
    return (
      <div className="w-full flex items-center justify-center gap-2
                      bg-gray-100 text-gray-400 py-3 rounded-md text-sm">
        <Link
                  href={`/login?callbackUrl=/anuncio/${anuncio.id}`}
                  className="w-full inline-flex items-center justify-center gap-2
                             bg-emerald-500 hover:bg-emerald-600 text-white
                             py-3 rounded-md text-lg font-semibold transition-colors"
                >
                  Faça login para ver o contato
                </Link>
      </div>
    );
  }
  
  if (!userHasPhone) {
    return (
      <div className="w-full flex items-center justify-center gap-2
                      bg-gray-100 text-gray-400 py-3 rounded-md text-sm">
        📵 Contato não disponível
      </div>
    );
  }

  return (
    <a
      href={whatsappLink}
      onClick={() => logEvent('ad_contact_click', { ad_id: anuncioId })}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center justify-center gap-2
                 bg-green-500 hover:bg-green-600 text-white
                 py-3 rounded-md text-lg font-semibold transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2a1 1 0 011 1v7h7a1 1 0 110 2h-7v7a1 1 0 11-2 0v-7H4a1 1 0 110-2h7V3a1 1 0 011-1z" />
      </svg>
      Tenho Interesse
    </a>
  );
}