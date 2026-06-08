'use client';

import { useEffect } from 'react';
import { logEvent } from '@/lib/analytics';

interface EventLoggerProps {
  eventName: string;
  payload: Record<string, any>;
}

export function EventLogger({ eventName, payload }: EventLoggerProps) {
  useEffect(() => {
    // A função passada para useEffect não pode ser async, mas podemos chamar uma função async dentro dela.
    const logPageView = async () => {
      await logEvent(eventName, payload);
    };

    logPageView();
  }, [eventName, payload]); // Dependências para re-disparar se a página ou ad_id mudar

  return null; // Este componente não renderiza nada visível
}