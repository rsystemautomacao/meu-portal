import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getClientIp, rateLimit, tooManyRequestsBody } from '@/lib/rateLimit'

// Usado pela tela de login para avisar quando um time bloqueado foi liberado.
// Responde só `canLogin`, e da mesma forma para e-mail inexistente, para não
// revelar quais e-mails têm conta nem dados do time.
export async function POST(request: Request) {
  try {
    const limit = rateLimit(`check-status:${getClientIp(request.headers)}`, 30, 10 * 60 * 1000)
    if (!limit.ok) {
      return NextResponse.json(tooManyRequestsBody(limit.retryAfterSec), { status: 429 })
    }

    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        teams: {
          include: {
            team: { select: { status: true, deletedAt: true } }
          }
        }
      }
    })

    const team = user?.teams[0]?.team
    if (!team) {
      return NextResponse.json({ canLogin: false })
    }

    const isBlocked = team.status === 'BLOCKED' || team.status === 'OVERDUE'
    const isDeleted = !!team.deletedAt

    return NextResponse.json({ canLogin: !isBlocked && !isDeleted })
  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}
