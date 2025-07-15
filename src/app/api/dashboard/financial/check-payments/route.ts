import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Verificar pagamentos em atraso
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      select: { teamId: true }
    })
    if (!teamUser) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    // Buscar configuração de mensalidade
    const config = await prisma.monthlyFeeConfig.findUnique({
      where: { teamId: teamUser.teamId }
    })

    const dueDay = config?.day || 10
    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()

    // Buscar jogadores com pagamentos pendentes
    const players = await prisma.player.findMany({
      where: { teamId: teamUser.teamId },
      include: {
        payments: {
          where: {
            year: currentYear,
            month: currentMonth
          }
        },
        monthlyFeeExceptions: {
          where: {
            year: currentYear,
            month: currentMonth
          }
        }
      }
    })

    const latePayments = []

    for (const player of players) {
      // Verificar se o jogador está isento
      const isExempt = player.monthlyFeeExceptions.some(ex => ex.isExempt)
      if (isExempt) continue

      // Verificar se já pagou
      const hasPaid = player.payments.some(p => p.status === 'paid')
      if (hasPaid) continue

      // Calcular data de vencimento
      const dueDate = new Date(currentYear, currentMonth - 1, dueDay)
      const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysLate > 0) {
        latePayments.push({
          id: player.id,
          message: `${player.name} está com mensalidade atrasada há ${daysLate} dia(s)`,
          playerName: player.name,
          daysLate,
          dueDate: dueDate.toISOString()
        })
      }
    }

    return NextResponse.json(latePayments)
  } catch (error) {
    console.error('Erro ao verificar pagamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar pagamentos' },
      { status: 500 }
    )
  }
} 