// proxy.ts (código da resposta anterior, que já está correto para este fluxo)
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string) {
            request.cookies.set(name, value)
          },
          remove(name: string) {
            request.cookies.set(name, '')
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // --- Definição de tipos de rota ---
    // Rotas que podem ser acessadas por não autenticados (landing e anúncios públicos)
    const isPubliclyViewableRoute = pathname === '/' || pathname.startsWith('/anuncio/')
    // Rotas de autenticação (login, cadastro)
    const isAuthRoute = pathname === '/login' || pathname === '/cadastro'
    // Rotas protegidas (feed, novo-anuncio, etc.)
    const isProtectedRoute = !isPubliclyViewableRoute && !isAuthRoute;


    // --- Lógica de Redirecionamento ---

    // 1. Se o usuário está autenticado
    if (user) {
      // Se o usuário logado tentar acessar a landing, login ou cadastro, redireciona para o feed
      if (isPubliclyViewableRoute || isAuthRoute) {
        return NextResponse.redirect(new URL('/feed', request.url))
      }
      // Para todas as outras rotas (incluindo /anuncio/[id] e outras rotas protegidas), permite o acesso
      return NextResponse.next()
    }

    // 2. Se o usuário NÃO está autenticado
    if (!user) {
      // Se for uma rota publicamente visível (apenas a landing), permite o acesso
      if (isPubliclyViewableRoute) {
        return NextResponse.next()
      }
      // Se for uma rota de autenticação (login/cadastro), permite o acesso
      if (isAuthRoute) {
        return NextResponse.next()
      }
      // Se for uma rota protegida (incluindo /anuncio/[id]), redireciona para o login
      if (isProtectedRoute) {
        // Adiciona o callbackUrl para redirecionar de volta após o login
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Caso padrão, permite o acesso (deve ser raro chegar aqui)
    return NextResponse.next()

  } catch (e) {
    console.error('Erro no middleware:', e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}