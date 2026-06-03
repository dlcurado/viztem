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
    // Rota pública: landing e anúncios públicos
    const isPubliclyViewableRoute = pathname === '/' || pathname.startsWith('/anuncio/')
    const isAuthRoute = pathname === '/login' || pathname === '/cadastro'
    const isProtectedRoute = !isPubliclyViewableRoute && !isAuthRoute

    // --- Lógica de Redirecionamento ---

    console.log(`Middleware: User ${user ? 'authenticated' : 'not authenticated'}, 
      Path: ${pathname}`);

    console.log(`Route Types: Publicly Viewable: ${isPubliclyViewableRoute},
       Auth Route: ${isAuthRoute}, 
       Protected Route: ${isProtectedRoute}`);
    
       // 1. Se o usuário está autenticado
    if (user) {
      // Usuário autenticado: apenas '/' e rotas de auth redirecionam para /feed
      if (pathname === '/' || isAuthRoute) {
        return NextResponse.redirect(new URL('/feed', request.url))
      }
      return NextResponse.next()
    }

    // 2. Se o usuário NÃO está autenticado
    if (!user) {
      // Permite acesso a rotas públicas (landing e /anuncio/*) e páginas de auth
      if (isPubliclyViewableRoute || isAuthRoute) {
        return NextResponse.next()
      }
      // Rotas protegidas redirecionam direto para /login com callbackUrl = pathname
      if (isProtectedRoute) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(redirectUrl)
      }
      return NextResponse.next()
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