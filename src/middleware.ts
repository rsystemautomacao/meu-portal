import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/logout',
  '/auth/register',
  '/auth/error',
  '/acesso-bloqueado',
  '/admin/login'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir acesso a rotas públicas
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Proteger rotas do admin (como já faz)
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }
    const adminSession = request.cookies.get('adminSession')
    if (!adminSession || adminSession.value !== 'true') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // Proteger rotas do app para usuários comuns
  // Buscar token JWT da sessão next-auth
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !token.id) {
    // Não autenticado, redirecionar para login
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Buscar o time do usuário
  const teamUser = await prisma.teamUser.findFirst({
    where: { userId: token.id },
    include: { team: true }
  })
  if (!teamUser || !teamUser.team) {
    // Usuário não pertence a time
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Se o time está bloqueado ou pausado, redirecionar para aviso
  if (teamUser.team.status === 'BLOCKED' || teamUser.team.status === 'PAUSED') {
    if (!pathname.startsWith('/acesso-bloqueado')) {
      return NextResponse.redirect(new URL('/acesso-bloqueado', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|api|static|favicon.ico).*)'
  ]
} 