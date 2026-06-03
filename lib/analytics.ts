// lib/analytics.ts
import { v4 as uuidv4 } from 'uuid';

const SESSION_ID_KEY = 'viztem_session_id';

// Função para obter ou gerar um session_id
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    // No servidor, não temos localStorage, então geramos um novo ou retornamos null
    // Para Server Components, o session_id pode ser gerado no momento da requisição
    // e passado para o cliente, ou ignorado se não for essencial para o evento.
    // Para este MVP, vamos focar no cliente.
    return ''; // Ou throw new Error('Session ID not available on server');
  }

  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// Função para registrar um evento
export async function logEvent(eventName: string, payload: Record<string, any> = {}) {
  const sessionId = getOrCreateSessionId();

  try {
    const response = await fetch('/api/log-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_name: eventName,
        payload,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Failed to log event ${eventName}:`, errorData);
    } else {
      // Se a API gerar um novo session_id (ex: se o cliente não enviou um), atualiza
      const responseData = await response.json();
      if (responseData.session_id && responseData.session_id !== sessionId) {
        localStorage.setItem(SESSION_ID_KEY, responseData.session_id);
      }
    }
  } catch (error) {
    console.error(`Error sending event ${eventName}:`, error);
  }
}