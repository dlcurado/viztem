// components/analytics/FirstFeedViewLogger.tsx
'use client';

import { useEffect } from 'react';
import { logEvent } from '@/lib/analytics';
import { createClient } from '@/lib/supabase/client'; // Para obter o user_id e condominio_id
import { EventLogger } from './EventLogger';

export function FirstFeedViewLogger() {
  useEffect(() => {
    const checkAndLogFirstFeedView = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Variáveis para registrar o evento page_view ou first_feed_view
      let eventName = 'page_view';
      const payload: Record<string, any> = { page: 'feed' };
      let condominio_id: string | undefined = undefined;
      let user_id: string | undefined = undefined;
      payload.page = 'feed';
      
      if (user) {
        user_id = user.id;
        // Buscar o perfil para obter o condominio_id
        const { data: perfilData } = await supabase.from('perfis').select('condominio_id').eq('id', user.id).single();
        if (perfilData) {
          condominio_id = perfilData.condominio_id;
        }          
        const hasSeenFeed = localStorage.getItem('hasSeenFeed');
        if (!hasSeenFeed) {
          eventName = 'first_feed_view';
          localStorage.setItem('hasSeenFeed', 'true'); // Marca como visto
        }
      }

      payload.user_id = user_id;
      payload.condominio_id = condominio_id;

      await logEvent(eventName, payload );
    };
    checkAndLogFirstFeedView();
  }, []); // Executa apenas uma vez no carregamento do componente

  return null; // Este componente não renderiza nada visível
}