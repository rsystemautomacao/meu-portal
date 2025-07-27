import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Buscar histórico de pagamentos para relatório compartilhado
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    const monthsBack = parseInt(searchParams.get('monthsBack') || '12')
    const status = searchParams.get('status') || 'all'

    console.log('🔍 API shared-reports payment-history chamada')
    console.log('📋 Parâmetros:', { token, playerId, monthsBack, status })

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

    // Calcular período
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1)

    // Buscar configuração de mensalidade
    const config = await prisma.monthlyFeeConfig.findUnique({
      where: { teamId: sharedReport.team.id }
    })

    const dueDay = config?.day || 10

    // Construir where clause para jogadores
    const playerWhere = {
      teamId: sharedReport.team.id,
      ...(playerId && { id: playerId })
    }

    // Buscar jogadores com pagamentos e débitos históricos
    const players = await prisma.player.findMany({
      where: playerWhere,
      include: {
        payments: {
          where: {
            dueDate: {
              gte: startDate
            }
          },
          orderBy: { dueDate: 'desc' }
        },
        monthlyFeeExceptions: {
          where: {
            year: {
              gte: startDate.getFullYear()
            }
          }
        }
      }
    })

    console.log(`📊 Jogadores encontrados: ${players.length}`)

    // Buscar débitos históricos separadamente
    const historicalDebts = await (prisma as any).historicalDebt.findMany({
      where: {
        teamId: sharedReport.team.id,
        ...(playerId && { playerId })
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📊 Débitos históricos encontrados: ${historicalDebts.length}`)

    // Processar dados dos jogadores
    const playersWithHistory = players
      .filter((player: any) => !player.isExempt)
      .map((player: any) => {
        // Calcular total em aberto (pagamentos + débitos históricos)
        const outstandingPayments = player.payments.filter((p: any) => 
          p.status === 'PENDING' || p.status === 'LATE'
        )
        
        // Buscar débitos históricos deste jogador
        const playerHistoricalDebts = historicalDebts.filter((d: any) => d.playerId === player.id)
        const totalHistoricalDebt = playerHistoricalDebts.reduce((sum: number, d: any) => sum + d.amount, 0)
        
        // Verificar se o mês atual está em atraso
        const currentMonth = today.getMonth() + 1
        const currentYear = today.getFullYear()
        const currentMonthPayment = player.payments.find((p: any) => 
          p.month === currentMonth && p.year === currentYear
        )
        
        let additionalCurrentMonthDebt = 0
        let additionalCurrentMonthCount = 0
        
        // Se não há pagamento para o mês atual ou está em atraso, adicionar ao total
        if (!currentMonthPayment || (currentMonthPayment.status !== 'PAID' && today.getDate() > dueDay)) {
          additionalCurrentMonthDebt = player.monthlyFee
          additionalCurrentMonthCount = 1
        }
        
        const totalOutstanding = outstandingPayments.reduce((sum: number, p: any) => sum + p.amount, 0) + 
                                totalHistoricalDebt + additionalCurrentMonthDebt
        const monthsOutstanding = outstandingPayments.length + playerHistoricalDebts.length + additionalCurrentMonthCount

        // Filtrar pagamentos por status se especificado
        let filteredPayments = player.payments
        if (status === 'outstanding') {
          filteredPayments = outstandingPayments
        } else if (status === 'paid') {
          filteredPayments = player.payments.filter((p: any) => p.status === 'PAID')
        }

        // Processar pagamentos para exibição
        const processedPayments = filteredPayments.map((payment: any) => {
          const dueDate = new Date(payment.dueDate)
          const isLate = dueDate < today && payment.status !== 'PAID'
          
          return {
            id: payment.id,
            month: dueDate.getMonth() + 1,
            year: dueDate.getFullYear(),
            amount: payment.amount,
            status: payment.status,
            dueDate: payment.dueDate,
            paymentDate: payment.paymentDate,
            isLate,
            daysLate: isLate ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
          }
        })

        return {
          id: player.id,
          name: player.name,
          monthlyFee: player.monthlyFee,
          totalOutstanding,
          monthsOutstanding,
          payments: processedPayments,
          hasOutstandingPayments: totalOutstanding > 0
        }
      })

    // Filtrar por status se especificado
    let filteredPlayers = playersWithHistory
    if (status === 'outstanding') {
      filteredPlayers = playersWithHistory.filter(p => p.hasOutstandingPayments)
    }

    // Calcular totais gerais
    const totalOutstanding = filteredPlayers.reduce((sum, p) => sum + p.totalOutstanding, 0)
    const playersWithDebt = filteredPlayers.filter(p => p.hasOutstandingPayments).length

    const response = {
      players: filteredPlayers,
      summary: {
        totalOutstanding,
        playersWithDebt,
        totalPlayers: filteredPlayers.length,
        period: {
          startDate: startDate.toISOString(),
          endDate: today.toISOString(),
          monthsBack
        }
      }
    }

    console.log('💰 Totais calculados:', {
      totalOutstanding,
      playersWithDebt,
      totalPlayers: filteredPlayers.length
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Erro ao buscar histórico de pagamentos para relatório compartilhado:", error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 