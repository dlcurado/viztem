'use client';

import { useEffect } from 'react';
import { logEvent } from '@/lib/analytics';

interface PageViewLoggerProps {
  page: string;
  // Adicione outros parâmetros que você queira passar para o evento page_view
  // Por exemplo, para ad_view, você passaria ad_id
  ad_id?: string;
}

export function PageViewLogger({ page, ad_id }: PageViewLoggerProps) {
  useEffect(() => {
    // A função passada para useEffect não pode ser async, mas podemos chamar uma função async dentro dela.
    const logPageView = async () => {
      const payload: Record<string, any> = { page };
      if (ad_id) {
        payload.ad_id = ad_id;
      }
      await logEvent('page_view', payload);
    };

    logPageView();
  }, [page, ad_id]); // Dependências para re-disparar se a página ou ad_id mudar

  return null; // Este componente não renderiza nada visível
}