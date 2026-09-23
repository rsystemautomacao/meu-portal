import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getCookieValueFromHeader, verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/adminAuth'
import { getClientIp, rateLimit } from '@/lib/rateLimit'

const LOGIN_ATTEMPTS_LIMIT = 10
const LOGIN_WINDOW_MS = 15 * 60 * 1000

async function assertTeamNotBlocked(userId: string) {
  const teamUser = await prisma.teamUser.findFirst({
    where: { userId },
    include: { team: true }
  })
  if (teamUser && teamUser.team && teamUser.team.status === 'BLOCKED') {
    // Retornar erro específico para bloqueio
    throw new Error('blocked')
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
        impersonate: { label: 'Impersonate', type: 'text' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email) {
          return null
        }

        // Suporte ao cliente: entrar como qualquer usuário. A autorização é a sessão
        // do painel /admin (cookie httpOnly assinado), sem senha, para que nenhuma
        // senha precise existir no código que vai para o navegador.
        if (credentials.impersonate === 'true') {
          const adminCookieValue = getCookieValueFromHeader(req?.headers?.cookie, ADMIN_SESSION_COOKIE)
          const adminSession = await verifyAdminSessionToken(adminCookieValue)
          if (!adminSession) {
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })
          if (!user || !user.name) {
            return null
          }

          await assertTeamNotBlocked(user.id)

          console.info(`[auth] Admin ${adminSession.email} entrou como ${user.email}`)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: true, // Sempre admin quando é acesso de suporte
            isUniversalAdmin: true, // Flag para identificar que é admin universal
          }
        }

        // Login normal
        if (!credentials.password) {
          return null
        }

        const ip = getClientIp(req?.headers)
        const limit = rateLimit(`login:${ip}:${credentials.email.toLowerCase()}`, LOGIN_ATTEMPTS_LIMIT, LOGIN_WINDOW_MS)
        if (!limit.ok) {
          throw new Error('rate_limited')
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        if (!user.email || !user.password || !user.name) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        await assertTeamNotBlocked(user.id)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          isUniversalAdmin: false,
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = user.isAdmin
        token.isUniversalAdmin = user.isUniversalAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isAdmin = token.isAdmin as boolean
        session.user.isUniversalAdmin = token.isUniversalAdmin as boolean
      }
      return session
    }
  }
}
