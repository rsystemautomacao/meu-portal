import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to parse score and determine match result
const getMatchResult = (score: string | null): 'victory' | 'draw' | 'defeat' | null => {
  if (!score) return null;
  const parts = score.split('x').map(s => parseInt(s.trim(), 10));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;

  const [teamScore, opponentScore] = parts;
  if (teamScore > opponentScore) return 'victory'
  if (teamScore < opponentScore) return 'defeat'
  return 'draw'
}

// Helper function to get team score from score string
const getTeamScore = (score: string | null): number => {
    if (!score) return 0;
    const parts = score.split('x').map(s => parseInt(s.trim(), 10));
    if (parts.length !== 2 || isNaN(parts[0])) return 0;
    return parts[0];
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
    })

    if (!teamUser) {
      return NextResponse.json({ error: 'Team not found for user' }, { status: 404 })
    }

    const teamId = teamUser.teamId

    // 1. Get last match result
    const lastMatch = await prisma.match.findFirst({
      where: { teamId },
      orderBy: { date: 'desc' },
    })

    const lastMatchResult = getMatchResult(lastMatch?.score ?? null)

    // 2. Calculate balance
    const teamTransactions = await prisma.transaction.findMany({
      where: { teamId },
    })

    const balance = teamTransactions.reduce((acc, transaction) => {
        if (transaction.type === 'INCOME') {
            return acc + transaction.amount
        } else { // EXPENSE
            return acc - transaction.amount
        }
    }, 0);

    // 3. Get pending payments
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    const players = await prisma.player.findMany({
        where: { 
            teamId,
            status: 'ACTIVE'
        },
        include: {
            payments: {
                where: {
                    month: currentMonth,
                    year: currentYear
                }
            },
            feeException: true
        }
    });

    const pendingPayments = players.filter(p => 
        p.payments.length === 0 &&
        !p.feeException?.isExempt
    ).length;

    // 4. Get player counts
    const totalPlayers = await prisma.player.count({ where: { teamId } })
    const activePlayers = await prisma.player.count({
      where: { teamId, status: 'ACTIVE' },
    })

    // 5. Get recent matches
    const recentMatchesData = await prisma.match.findMany({
      where: { teamId },
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        stats: {
          select: {
            yellowCards: true,
            redCards: true,
          }
        }
      }
    })

    const recentMatches = recentMatchesData.map(match => {
      const totalYellowCards = match.stats.reduce((sum, stat) => sum + stat.yellowCards, 0);
      const totalRedCards = match.stats.reduce((sum, stat) => sum + stat.redCards, 0);

      return {
        id: match.id,
        opponent: match.opponent,
        date: match.date.toISOString(),
        score: match.score ?? '0 x 0',
        result: getMatchResult(match.score),
        stats: {
          goals: getTeamScore(match.score),
          yellowCards: totalYellowCards,
          redCards: totalRedCards,
        },
      }
    });

    // 6. Get recent transactions
    const recentTransactionsData = await prisma.transaction.findMany({
      where: { teamId },
      orderBy: { date: 'desc' },
      take: 5,
    })

    const recentTransactions = recentTransactionsData.map(t => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      type: t.type === 'INCOME' ? 'income' : 'expense',
    }))

    const dashboardData = {
      lastMatchResult,
      balance,
      pendingPayments,
      activePlayers,
      totalPlayers,
      recentMatches,
      recentTransactions,
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('[DASHBOARD_SUMMARY_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 