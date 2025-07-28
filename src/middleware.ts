import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/logout',
  '/auth/register',
  '/auth/error',
  '/acesso-bloqueado',
  '/admin/login'
]

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  // Se é uma rota de admin, não aplicar lógica de autenticação normal
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }
  
  // Verificar se a rota é pública
  const isPublicPath = PUBLIC_PATHS.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  
  // Se não está autenticado e não é rota pública, redirecionar para login
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  // Se o usuário está autenticado e não está acessando páginas de admin
  if (token && !request.nextUrl.pathname.startsWith('/admin')) {
    // Atualizar último acesso do time (apenas para rotas do dashboard e apenas se NÃO for admin universal)
    if ((request.nextUrl.pathname.startsWith('/dashboard') || 
         request.nextUrl.pathname.startsWith('/financial') ||
         request.nextUrl.pathname.startsWith('/matches') ||
         request.nextUrl.pathname.startsWith('/players') ||
         request.nextUrl.pathname.startsWith('/settings')) && 
        !token.isUniversalAdmin) {
      
      try {
        // Buscar o time do usuário e atualizar lastAccess
        const response = await fetch(`${request.nextUrl.origin}/api/update-last-access`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
        })
        
        if (!response.ok) {
          console.error('Erro ao atualizar último acesso:', response.status)
        }
      } catch (error) {
        console.error('Erro ao atualizar último acesso:', error)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 