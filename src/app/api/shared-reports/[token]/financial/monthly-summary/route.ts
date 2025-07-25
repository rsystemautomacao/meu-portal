import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Buscar resumo mensal para relatório compartilhado
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    if (!month) {
      return NextResponse.json({ error: 'Mês é obrigatório' }, { status: 400 })
    }

    // Validar token de compartilhamento
    const sharedReport = await prisma.sharedReport.findUnique({
      where: { shareToken: token },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!sharedReport || !sharedReport.isActive) {
      return NextResponse.json({ error: 'Relatório não encontrado ou inativo' }, { status: 404 })
    }

    // Parsear mês (formato: YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number)
    if (!year || !monthNum) {
      return NextResponse.json({ error: 'Formato de mês inválido' }, { status: 400 })
    }

    // Buscar transações do mês
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0, 23, 59, 59)

    const transactions = await prisma.transaction.findMany({
      where: {
        teamId: sharedReport.team.id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calcular totais
    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = income - expenses

    // Buscar pagamentos do mês através dos jogadores do time
    const players = await prisma.player.findMany({
      where: { teamId: sharedReport.team.id },
      select: { id: true }
    })
    
    const playerIds = players.map(p => p.id)
    
    const payments = await prisma.payment.findMany({
      where: {
        playerId: { in: playerIds },
        year: year,
        month: monthNum
      }
    })

    const totalPayments = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0)

    const pendingPayments = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
      month: month,
      income,
      expenses,
      balance,
      totalPayments,
      pendingPayments,
      transactions: transactions.length
    })
  } catch (error) {
    console.error("Erro ao buscar resumo mensal para relatório compartilhado:", error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 