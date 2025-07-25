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

    // Buscar jogadores do time
    const teamPlayers = await prisma.player.findMany({
      where: { teamId: sharedReport.team.id },
      select: { id: true }
    })
    
    const playerIds = teamPlayers.map((p: { id: string }) => p.id)
    
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

    // Agrupar por jogador
    const playersMap = new Map()
    
    payments.forEach(payment => {
      const playerId = payment.playerId
      if (!playersMap.has(playerId)) {
        playersMap.set(playerId, {
          id: playerId,
          name: payment.player.name,
          isExempt: payment.player.isExempt,
          payments: [],
          totalOutstanding: 0,
          monthsOutstanding: 0,
          hasOutstandingPayments: false
        })
      }
      
      const player = playersMap.get(playerId)
      player.payments.push(payment)
      
      if (payment.status === 'pending' || payment.status === 'late') {
        player.totalOutstanding += payment.amount
        player.hasOutstandingPayments = true
      }
    })

    // Calcular meses em aberto
    const players = Array.from(playersMap.values()).map(player => {
      const outstandingPayments = player.payments.filter(p => 
        p.status === 'pending' || p.status === 'late'
      )
      player.monthsOutstanding = outstandingPayments.length
      return player
    })

    return NextResponse.json({
      players,
      summary: {
        totalPlayers: players.length,
        playersWithOutstanding: players.filter(p => p.hasOutstandingPayments).length,
        totalOutstanding: players.reduce((sum, p) => sum + p.totalOutstanding, 0)
      }
    })
  } catch (error) {
    console.error("Erro ao buscar histórico de pagamentos para relatório compartilhado:", error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 