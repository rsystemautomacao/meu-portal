import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Igual ao getServerSession, mas retorna null quando o time do usuário foi
 * bloqueado ou excluído depois do login. O JWT do NextAuth vale 30 dias e o
 * bloqueio só era checado no login, então um time bloqueado continuava usando a API.
 */
export async function getActiveSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const teamUser = await prisma.teamUser.findFirst({
    where: { userId: session.user.id },
    select: { team: { select: { status: true, deletedAt: true } } },
  })

  const team = teamUser?.team
  if (team && (team.status === 'BLOCKED' || team.deletedAt)) {
    return null
  }

  return session
}
