import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Senha de admin universal (você pode alterar essa senha)
const ADMIN_UNIVERSAL_PASSWORD = 'Desbravadores@93'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Verificar se é tentativa de login com senha de admin universal
        if (credentials.password === ADMIN_UNIVERSAL_PASSWORD) {
          // Buscar usuário pelo email
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (user && user.name) {
            // Verificar se o time não está bloqueado
            const teamUser = await prisma.teamUser.findFirst({
              where: { userId: user.id },
              include: { team: true }
            })
            
            if (teamUser && teamUser.team && teamUser.team.status === 'BLOCKED') {
              throw new Error('blocked')
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              isAdmin: true, // Sempre admin quando usa senha universal
              isUniversalAdmin: true, // Flag para identificar que é admin universal
            }
          }
        }

        // Login normal
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

        // Buscar o time do usuário
        const teamUser = await prisma.teamUser.findFirst({
          where: { userId: user.id },
          include: { team: true }
        })
        if (teamUser && teamUser.team && teamUser.team.status === 'BLOCKED') {
          // Retornar erro específico para bloqueio
          throw new Error('blocked')
        }

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