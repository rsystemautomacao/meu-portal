import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        team: {
          include: {
            monthlyFeeConfig: true,
          },
        },
      },
    })

    if (!teamUser?.team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Buscar todos os jogadores do time
    const players = await prisma.player.findMany({
      where: { teamId: teamUser.team.id },
      include: {
        feeException: true,
        payments: {
          where: {
            dueDate: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth
            }
          }
        }
      }
    })

    const alerts = []

    for (const player of players) {
      // Verificar se o jogador tem uma exceção de mensalidade
      const monthlyFee = player.feeException?.amount || teamUser.team.monthlyFeeConfig?.amount || 0
      const isExempt = player.feeException?.isExempt || false

      if (isExempt) continue

      // Verificar se já pagou a mensalidade deste mês
      const hasPaid = player.payments.some(p => 
        p.amount >= monthlyFee && 
        p.status === 'PAID' &&
        p.dueDate >= firstDayOfMonth && 
        p.dueDate <= lastDayOfMonth
      )

      if (!hasPaid) {
        // Se estamos no dia 5 ou depois e ainda não pagou, está atrasado
        if (today.getDate() >= 5) {
          alerts.push({
            playerId: player.id,
            playerName: player.name,
            message: `Pagamento da mensalidade atrasado`,
            type: 'overdue',
            dueDate: firstDayOfMonth
          })
        } else {
          // Se ainda não chegou no dia 5, é um lembrete
          alerts.push({
            playerId: player.id,
            playerName: player.name,
            message: `Pagamento da mensalidade pendente`,
            type: 'missing',
            dueDate: new Date(today.getFullYear(), today.getMonth(), 5)
          })
        }
      }
    }

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Erro ao verificar pagamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar pagamentos' },
      { status: 500 }
    )
  }
} 