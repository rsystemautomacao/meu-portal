import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Buscar resumo mensal
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

    // Buscar parâmetros da query
    const { searchParams } = new URL(req.url)
    const monthParam = searchParams.get('month')
    
    let targetMonth: Date
    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number)
      // Corrigir: usar month diretamente (não subtrair 1) para o Date
      targetMonth = new Date(year, month - 1, 1) // month - 1 porque Date usa 0-11
    } else {
      targetMonth = new Date()
    }

    const month = targetMonth.getMonth() + 1 // Converter de volta para 1-12
    const year = targetMonth.getFullYear()

    // Buscar transações do mês
    const transactions = await prisma.transaction.findMany({
      where: {
        teamId: teamUser.teamId,
        date: {
          gte: new Date(year, month - 1, 1), // month - 1 para Date (0-11)
          lt: new Date(year, month, 1) // Próximo mês
        }
      }
    })

    // Calcular totais
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIncome - totalExpense

    // Agrupar por tipo
    const incomeByType: { [key: string]: number } = {}
    const expenseByType: { [key: string]: number } = {}

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        const type = transaction.description.split(' ')[0] || 'OTHER'
        incomeByType[type] = (incomeByType[type] || 0) + transaction.amount
      } else {
        const type = transaction.description.split(' ')[0] || 'OTHER'
        expenseByType[type] = (expenseByType[type] || 0) + transaction.amount
      }
    })

    return NextResponse.json({
      totalIncome,
      totalExpense,
      balance,
      incomeByType,
      expenseByType,
      month,
      year
    })
  } catch (error) {
    console.error('Erro ao buscar resumo mensal:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar resumo mensal' },
      { status: 500 }
    )
  }
} 