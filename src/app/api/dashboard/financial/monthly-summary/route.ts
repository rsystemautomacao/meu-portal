import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Payment, Player, MonthlyFeeException } from '@prisma/client'

interface PaymentWithPlayer extends Payment {
  player: Player & {
    feeException: MonthlyFeeException | null
  }
}

interface PendingPlayer {
  id: string
  name: string
  amount: number | null
  dueDate: Date | null
}

interface ExemptPlayer {
  id: string
  name: string
}

interface MonthlySummary {
  month: number
  year: number
  totalExpected: number
  totalReceived: number
  pendingAmount: number
  pendingPlayers: PendingPlayer[]
  exemptPlayers: ExemptPlayer[]
  totalPlayers: number
  paidPlayers: number
  pendingPlayersCount: number
  exemptPlayersCount: number
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter o mês e ano da query
    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get('month')

    if (!monthYear) {
      return NextResponse.json(
        { message: 'Mês não especificado' },
        { status: 400 }
      )
    }

    const [year, month] = monthYear.split('-').map(Number)

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        team: true,
      },
    })

    if (!teamUser?.team) {
      return NextResponse.json(
        { message: 'Time não encontrado' },
        { status: 404 }
      )
    }

    // Buscar pagamentos do mês
    const payments = await prisma.payment.findMany({
      where: {
        player: {
          teamId: teamUser.team.id,
        },
        month: month,
        year: year,
      },
      include: {
        player: {
          include: {
            feeException: true,
          },
        },
      },
    }) as PaymentWithPlayer[]

    // Calcular totais
    const totalExpected = payments.reduce((total, payment) => {
      if (payment.player.feeException?.isExempt) return total
      return total + (payment.amount || 0)
    }, 0)

    const totalReceived = payments.reduce((total, payment) => {
      if (payment.status === 'PAID') {
        return total + (payment.amount || 0)
      }
      return total
    }, 0)

    // Buscar jogadores com pagamento pendente
    const pendingPlayers = payments
      .filter(payment => payment.status === 'PENDING' && !payment.player.feeException?.isExempt)
      .map(payment => ({
        id: payment.player.id,
        name: payment.player.name,
        amount: payment.amount,
        dueDate: payment.dueDate,
      }))

    // Buscar jogadores isentos
    const exemptPlayers = payments
      .filter(payment => payment.player.feeException?.isExempt)
      .map(payment => ({
        id: payment.player.id,
        name: payment.player.name,
      }))

    const summary: MonthlySummary = {
      month,
      year,
      totalExpected,
      totalReceived,
      pendingAmount: totalExpected - totalReceived,
      pendingPlayers,
      exemptPlayers,
      totalPlayers: payments.length,
      paidPlayers: payments.filter(p => p.status === 'PAID').length,
      pendingPlayersCount: pendingPlayers.length,
      exemptPlayersCount: exemptPlayers.length,
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Erro ao buscar resumo mensal:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 