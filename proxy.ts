import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verificar sessão do usuário
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rotas públicas — não precisa de login
  const rotasPublicas = ['/login', '/cadastro']
  const ehRotaPublica = rotasPublicas.some((rota) =>
    pathname.startsWith(rota)
  )

  // Usuário não autenticado tentando acessar rota protegida
  if (!user && !ehRotaPublica) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Usuário autenticado tentando acessar login ou cadastro
  if (user && ehRotaPublica) {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Intercepta todas as rotas exceto:
     * - arquivos estáticos (_next, imagens, fontes)
     * - favicon
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}