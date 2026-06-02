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

    const { pathname, search } = request.nextUrl
    const callbackUrl = `${pathname}${search}`

    // --- Definição de tipos de rota ---
    const isLandingRoute = pathname === '/'
    const isPublicAdRoute = /^\/anuncio\/[^/]+\/?$/.test(pathname)
    const isAuthRoute = pathname === '/login' || pathname === '/cadastro'
    const isProtectedRoute = !isLandingRoute && !isAuthRoute && !isPublicAdRoute

    // --- Lógica de Redirecionamento ---

    // 1. Se o usuário está autenticado
    if (user) {
      // Se o usuário logado tentar acessar a landing ou as rotas de auth, redireciona para o feed
      if (isLandingRoute || isAuthRoute) {
        return NextResponse.redirect(new URL('/feed', request.url))
      }
      return NextResponse.next()
    }

    // 2. Se o usuário NÃO está autenticado
    if (!user) {
      // Se for landing, adiç��o de anúncio ou rota de auth, permite o acesso
      if (isLandingRoute || isAuthRoute || isPublicAdRoute) {
        return NextResponse.next()
      }
      if (isProtectedRoute) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('callbackUrl', callbackUrl)
        return NextResponse.redirect(redirectUrl)
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