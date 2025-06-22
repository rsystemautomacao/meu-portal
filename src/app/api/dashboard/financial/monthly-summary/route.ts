import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Payment, Player, MonthlyFeeException } from '@prisma/client'

interface PaymentWithPlayer extends Payment {
  player: Player & {
    monthlyFeeExceptions: MonthlyFeeException[]
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

    // Buscar todos os pagamentos do time para o mês atual
    const payments = await prisma.payment.findMany({
      where: {
        player: {
          teamId: teamUser.team.id,
        },
        month: currentMonth,
        year: currentYear,
      },
      include: {
        player: {
          include: {
            monthlyFeeExceptions: {
              where: {
                month: currentMonth,
                year: currentYear,
              },
            },
          },
        },
      },
    }) as PaymentWithPlayer[]

    // Calcular totais
    const totalExpected = payments.reduce((total, payment) => {
      const feeException = payment.player.monthlyFeeExceptions[0]
      if (feeException?.isExempt) return total
      return total + (teamUser.team.monthlyFees[0]?.amount || 0)
    }, 0)

    const totalPaid = payments
      .filter(payment => payment.paid)
      .reduce((total, payment) => total + payment.amount, 0)

    const totalPending = payments
      .filter(payment => !payment.paid && payment.status === 'PENDING')
      .filter(payment => !payment.player.monthlyFeeExceptions[0]?.isExempt)
      .reduce((total, payment) => total + payment.amount, 0)

    const totalExempt = payments
      .filter(payment => payment.player.monthlyFeeExceptions[0]?.isExempt)
      .length

    return NextResponse.json({
      totalExpected,
      totalPaid,
      totalPending,
      totalExempt,
      month: currentMonth,
      year: currentYear,
    })
  } catch (error) {
    console.error('Erro ao buscar resumo mensal:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar resumo mensal' },
      { status: 500 }
    )
  }
} 