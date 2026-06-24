// components/anuncios/WhatsAppContactButton.tsx
'use client';

import { logEvent } from '@/lib/analytics';
import Link from 'next/link'

interface UrlContactButton {
  user: any; // Você pode substituir 'any' pelo tipo do usuário que você tem no seu projeto
  anuncioId: string;
  url: string;
}

export function UrlContactButton({ user, anuncioId, url }: UrlContactButton) {
  if(!user){
    return (
      <div className="w-full flex items-center justify-center gap-2
                      bg-gray-100 text-gray-400 py-3 rounded-md text-sm">
        <Link
                  href={`/login?callbackUrl=/anuncio/${anuncioId}`}
                  className="w-full inline-flex items-center justify-center gap-2
                             bg-emerald-500 hover:bg-emerald-600 text-white
                             py-3 rounded-md text-lg font-semibold transition-colors"
                >
                  Faça login para ver o site
                </Link>
      </div>
    );
  }
  
  if (url) {
    return (
      <a
        href={url}
        onClick={() => logEvent('ad_url_click', 
            { ad_id: anuncioId, user_id: user.id, condominio_id: user.condominio_id }
          )}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm
          hover:bg-green-50 hover:scale-110 transition-all duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 26 26"
          fill="currentColor"
          className="w-10 h-10 text-slate-600"
        >
          <path d="M16.855 22.062c0.512 -0.787 1.023 -1.8 1.391 -3.099 0.849 0.327 1.432 0.716 1.79 1.023a9.225 9.225 0 0 1 -3.222 2.076zm-9.9 -2.087c0.378 -0.307 0.951 -0.687 1.8 -1.025 0.378 1.309 0.87 2.322 1.391 3.109A9.225 9.225 0 0 1 6.975 19.973zm11.965 -7.497q-0.047 -1.37 -0.276 -2.72c1.125 -0.409 1.943 -0.9 2.516 -1.35a9.225 9.225 0 0 1 1.442 4.07zm-10.095 -4.725a6.75 6.75 0 0 1 -1.667 -0.9 9.225 9.225 0 0 1 2.987 -1.912c-0.48 0.716 -0.951 1.637 -1.33 2.813zm8.029 -2.811a9.225 9.225 0 0 1 2.987 1.912 6.75 6.75 0 0 1 -1.667 0.9 10.8 10.8 0 0 0 -1.33 -2.813zM16.65 10.258c0.102 0.675 0.205 1.401 0.225 2.22H10.125q0.047 -1.223 0.205 -2.22a17.775 17.775 0 0 0 6.31 0zM13.5 8.488a16.875 16.875 0 0 1 -2.69 -0.205c0.816 -2.516 2.087 -3.528 2.69 -3.887 0.583 0.358 1.862 1.38 2.68 3.887A16.425 16.425 0 0 1 13.5 8.488m-7.67 -0.082a9 9 0 0 0 2.526 1.35 20.25 20.25 0 0 0 -0.276 2.721H4.355a9.112 9.112 0 0 1 1.483 -4.07zm-1.463 6.117h3.712c0.04 0.88 0.102 1.688 0.225 2.424a8.55 8.55 0 0 0 -2.6 1.432 9.112 9.112 0 0 1 -1.35 -3.855zM13.5 16.16c-1.227 0 -2.28 0.102 -3.201 0.265A18 18 0 0 1 10.125 14.525h6.75a20.25 20.25 0 0 1 -0.163 1.9A17.438 17.438 0 0 0 13.5 16.149zm0 6.443c-0.613 -0.368 -1.963 -1.463 -2.782 -4.193A15.75 15.75 0 0 1 13.5 18.205c1.074 0 1.995 0.072 2.792 0.205 -0.818 2.762 -2.168 3.825 -2.782 4.193zm7.793 -4.234a8.55 8.55 0 0 0 -2.598 -1.432 20.25 20.25 0 0 0 0.225 -2.413h3.725a9.112 9.112 0 0 1 -1.35 3.845zM13.5 2.25a11.25 11.25 0 1 0 0 22.5 11.25 11.25 0 1 0 0 -22.5"/>
        </svg>
      </a>
    );
  }

  return null;
}