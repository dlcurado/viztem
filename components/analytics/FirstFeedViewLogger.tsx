// components/analytics/FirstFeedViewLogger.tsx
'use client';

import { useEffect } from 'react';
import { logEvent } from '@/lib/analytics';
import { createClient } from '@/lib/supabase/client'; // Para obter o user_id e condominio_id

export function FirstFeedViewLogger() {
  useEffect(() => {
    const checkAndLogFirstFeedView = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const hasSeenFeed = localStorage.getItem('hasSeenFeed');
        if (!hasSeenFeed) {
          let condominio_id = 'desconhecido';
          // Buscar o perfil para obter o condominio_id
          const { data: perfilData } = await supabase.from('perfis').select('condominio_id').eq('id', user.id).single();
          if (perfilData) {
            condominio_id = perfilData.condominio_id;
          }
          await logEvent('first_feed_view', { condominio_id });
          localStorage.setItem('hasSeenFeed', 'true'); // Marca como visto
        }
      }
    };
    checkAndLogFirstFeedView();
  }, []); // Executa apenas uma vez no carregamento do componente

  return null; // Este componente não renderiza nada visível
}