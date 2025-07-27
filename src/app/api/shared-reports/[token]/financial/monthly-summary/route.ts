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

    console.log('🔍 API shared-reports monthly-summary chamada')
    console.log('📋 Parâmetros:', { token, month })

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

    console.log('📊 SharedReport encontrado:', sharedReport ? 'Sim' : 'Não')
    if (sharedReport) {
      console.log('   - Team ID:', sharedReport.team.id)
      console.log('   - Team Name:', sharedReport.team.name)
      console.log('   - Is Active:', sharedReport.isActive)
    }

    if (!sharedReport || !sharedReport.isActive) {
      return NextResponse.json({ error: 'Relatório não encontrado ou inativo' }, { status: 404 })
    }

    // Parsear mês (formato: YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number)
    if (!year || !monthNum) {
      return NextResponse.json({ error: 'Formato de mês inválido' }, { status: 400 })
    }

    // Usar a mesma lógica do dashboard
    const targetMonth = new Date(year, monthNum - 1, 1)
    const nextMonth = new Date(year, monthNum, 1)

    console.log('📅 Período de busca:', { targetMonth, nextMonth })

    const transactions = await prisma.transaction.findMany({
      where: {
        teamId: sharedReport.team.id,
        date: {
          gte: targetMonth,
          lt: nextMonth
        }
      }
    })

    console.log(`📊 Transações encontradas: ${transactions.length}`)
    transactions.forEach((t, index) => {
      console.log(`   ${index + 1}. ${t.description} - ${t.type} - R$ ${t.amount}`)
    })

    // Calcular totais usando a mesma lógica do dashboard
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIncome - totalExpense

    console.log('💰 Totais calculados:', { totalIncome, totalExpense, balance })

    // Agrupar por tipo usando a mesma lógica do dashboard
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

    const response = {
      totalIncome,
      totalExpense,
      balance,
      incomeByType,
      expenseByType,
      month: monthNum,
      year: year
    }
    
    console.log('✅ Resposta da API:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Erro ao buscar resumo mensal para relatório compartilhado:", error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 