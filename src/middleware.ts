import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Proteger rotas do admin
  if (pathname.startsWith('/admin')) {
    // Permitir acesso à página de login do admin
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Verificar se há sessão de admin
    const adminSession = request.cookies.get('adminSession')
    
    if (!adminSession || adminSession.value !== 'true') {
      // Redirecionar para login se não estiver autenticado
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*'
  ]
} 