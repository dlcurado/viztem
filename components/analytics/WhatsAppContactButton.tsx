// components/anuncios/WhatsAppContactButton.tsx
'use client';

import { logEvent } from '@/lib/analytics';
import Link from 'next/link'

interface WhatsAppContactButtonProps {
  user: any; // Você pode substituir 'any' pelo tipo do usuário que você tem no seu projeto
  anuncioId: string;
  whatsappLink: any;
  anuncioHasPhone: boolean; // Indica se o usuário logado tem telefone para a mensagem
}

export function WhatsAppContactButton({ user, anuncioId, whatsappLink, anuncioHasPhone }: WhatsAppContactButtonProps) {
  if(!user){
    return (
      <div className="w-full flex items-center justify-center gap-2
                      bg-gray-100 text-gray-400 rounded-md text-sm">
        <Link
                  href={`/login?callbackUrl=/anuncio/${anuncioId}`}
                  className="w-full inline-flex items-center justify-center gap-2
                             bg-emerald-500 hover:bg-emerald-600 text-white
                             py-3 rounded-md text-lg font-semibold transition-colors"
                >
                  Ver +
                </Link>
      </div>
    );
  }
  
  if (!anuncioHasPhone) {
    return (
      <div className="flex items-center justify-center
                      bg-gray-100 text-gray-400 rounded-full">
        <h1 className="text-4xl">📵</h1>
      </div>
    );
  }

  return (
    <a
      href={whatsappLink}
      onClick={() => logEvent('ad_contact_click', 
          { ad_id: anuncioId, user_id: user.id, condominio_id: user.condominio_id }
        )}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm
        hover:bg-green-50 hover:scale-110 transition-all duration-200"
    >
      <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="-2 0 26 26"
          fill="currentColor"
          className="w-8 h-8 text-green-500"
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
    </a>
  );
}