import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
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
            monthlyFees: true,
          },
        },
      },
    })

    if (!teamUser?.team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()

    // Buscar todos os jogadores do time
    const players = await prisma.player.findMany({
      where: { teamId: teamUser.team.id },
      include: {
        monthlyFeeExceptions: {
          where: {
            month: currentMonth,
            year: currentYear
          }
        },
        payments: {
          where: {
            month: currentMonth,
            year: currentYear
          }
        }
      }
    })

    const alerts = []

    for (const player of players) {
      // Verificar se o jogador tem uma exceção de mensalidade
      const feeException = player.monthlyFeeExceptions[0]
      const monthlyFee = feeException?.isExempt ? 0 : (teamUser.team.monthlyFees[0]?.amount || 0)
      const isExempt = feeException?.isExempt || false

      if (isExempt) continue

      // Verificar se já pagou a mensalidade deste mês
      const hasPaid = player.payments.some((p: any) => 
        p.amount >= monthlyFee && 
        p.paid === true
      )

      if (!hasPaid) {
        // Se estamos no dia 5 ou depois e ainda não pagou, está atrasado
        if (today.getDate() >= 5) {
          alerts.push({
            playerId: player.id,
            playerName: player.name,
            message: `Pagamento da mensalidade atrasado`,
            type: 'overdue',
            dueDate: new Date(currentYear, currentMonth - 1, 5)
          })
        } else {
          // Se ainda não chegou no dia 5, é um lembrete
          alerts.push({
            playerId: player.id,
            playerName: player.name,
            message: `Pagamento da mensalidade pendente`,
            type: 'missing',
            dueDate: new Date(currentYear, currentMonth - 1, 5)
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