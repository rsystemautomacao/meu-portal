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
    const monthsBack = parseInt(searchParams.get('monthsBack') || '12')
    const status = searchParams.get('status') || 'all'

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

    // Calcular período
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - monthsBack)

    // Buscar todos os jogadores do time
    const allPlayers = await prisma.player.findMany({
      where: { teamId: sharedReport.team.id },
      select: {
        id: true,
        name: true,
        isExempt: true,
        monthlyFee: true
      }
    })
    
    const playerIds = allPlayers.map(p => p.id)
    
    // Buscar pagamentos do período
    const payments = await prisma.payment.findMany({
      where: {
        playerId: { in: playerIds },
        dueDate: {
          gte: startDate,
          lte: endDate
        },
        ...(status !== 'all' && { status })
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            isExempt: true
          }
        }
      },
      orderBy: { dueDate: 'desc' }
    })

    // Inicializar mapa com todos os jogadores
    const playersMap = new Map()
    
    allPlayers.forEach(player => {
      playersMap.set(player.id, {
        id: player.id,
        name: player.name,
        monthlyFee: player.monthlyFee || 0,
        isExempt: player.isExempt,
          payments: [],
          totalOutstanding: 0,
          monthsOutstanding: 0,
          hasOutstandingPayments: false
        })
    })
    
    // Adicionar pagamentos aos jogadores
    payments.forEach(payment => {
      const player = playersMap.get(payment.playerId)
      if (player) {
        // Processar pagamento para exibição
        const dueDate = new Date(payment.dueDate)
        const today = new Date()
        const isLate = dueDate < today && payment.status !== 'paid'
        
        const processedPayment = {
          id: payment.id,
          month: dueDate.getMonth() + 1,
          year: dueDate.getFullYear(),
          amount: payment.amount,
          status: payment.status.toUpperCase(),
          dueDate: payment.dueDate,
          paymentDate: payment.paymentDate,
          isLate,
          daysLate: isLate ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
        }
        
        player.payments.push(processedPayment)
      
      if (payment.status === 'pending' || payment.status === 'late') {
        player.totalOutstanding += payment.amount
        player.hasOutstandingPayments = true
        }
      }
    })

    // Calcular meses em aberto
    const players = Array.from(playersMap.values()).map(player => {
      const outstandingPayments = player.payments.filter((p: any) =>
        p.status === 'pending' || p.status === 'late'
      )
      player.monthsOutstanding = outstandingPayments.length
      return player
    })

    const response = {
      players,
      summary: {
        totalPlayers: players.length,
        playersWithDebt: players.filter(p => p.hasOutstandingPayments).length,
        totalOutstanding: players.reduce((sum, p) => sum + p.totalOutstanding, 0)
      }
    }
    

    
    return NextResponse.json(response)
  } catch (error) {
    console.error("Erro ao buscar histórico de pagamentos para relatório compartilhado:", error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 