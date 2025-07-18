import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

    // Saldo em caixa
    const transactions = await prisma.transaction.findMany({
      where: { teamId: teamUser.teamId },
      orderBy: { date: 'desc' }
    })
    const balance = transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0)

    // Jogadores ativos e total
    const players = await prisma.player.findMany({
      where: { teamId: teamUser.teamId },
    })
    const activePlayers = players.filter(p => p.status === 'ACTIVE').length
    const totalPlayers = players.length

    // Pendências financeiras (jogadores com pagamentos pendentes)
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const pendingPayments = await prisma.payment.count({
      where: {
        player: { teamId: teamUser.teamId },
        month: currentMonth,
        year: currentYear,
        status: { not: 'paid' }
      }
    })

    // Últimas partidas
    const recentMatches = await prisma.match.findMany({
      where: { teamId: teamUser.teamId },
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        events: true
      }
    })
    // Último resultado
    let lastMatchResult: 'victory' | 'draw' | 'defeat' | null = null
    if (recentMatches.length > 0) {
      const last = recentMatches[0]
      if (last.ourScore > last.opponentScore) lastMatchResult = 'victory'
      else if (last.ourScore < last.opponentScore) lastMatchResult = 'defeat'
      else lastMatchResult = 'draw'
    }

    // Últimas transações
    const recentTransactions = transactions.slice(0, 5).map(t => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      type: t.type
    }))

    return NextResponse.json({
      lastMatchResult,
      balance,
      pendingPayments,
      activePlayers,
      totalPlayers,
      recentMatches,
      recentTransactions
    })
  } catch (error) {
    console.error('Erro ao buscar resumo do dashboard:', error)
    return NextResponse.json({ error: 'Erro ao buscar resumo do dashboard' }, { status: 500 })
  }
} 