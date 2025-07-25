import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Buscar partidas para relatório compartilhado
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

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

    // Construir filtros de data
    const whereClause: any = {
      teamId: sharedReport.team.id
    }

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      whereClause.date = {
        gte: startDate,
        lte: endDate
      }
    }

    // Buscar partidas
    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        events: {
          orderBy: {
            minute: 'asc'
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Processar estatísticas
    const totalMatches = matches.length
    const wins = matches.filter(m => {
      const ourScore = m.ourScore || 0
      const opponentScore = m.opponentScore || 0
      return ourScore > opponentScore
    }).length
    const losses = matches.filter(m => {
      const ourScore = m.ourScore || 0
      const opponentScore = m.opponentScore || 0
      return ourScore < opponentScore
    }).length
    const draws = totalMatches - wins - losses

    // Calcular estatísticas de gols
    const totalGoalsScored = matches.reduce((sum, m) => sum + (m.ourScore || 0), 0)
    const totalGoalsConceded = matches.reduce((sum, m) => sum + (m.opponentScore || 0), 0)
    const averageGoalsScored = totalMatches > 0 ? (totalGoalsScored / totalMatches).toFixed(1) : '0.0'
    const averageGoalsConceded = totalMatches > 0 ? (totalGoalsConceded / totalMatches).toFixed(1) : '0.0'

    // Processar eventos por tipo
    const eventsByType = matches.reduce((acc, match) => {
      match.events.forEach(event => {
        const type = event.type
        if (!acc[type]) {
          acc[type] = 0
        }
        acc[type]++
      })
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      matches,
      statistics: {
        totalMatches,
        wins,
        losses,
        draws,
        totalGoalsScored,
        totalGoalsConceded,
        averageGoalsScored: parseFloat(averageGoalsScored),
        averageGoalsConceded: parseFloat(averageGoalsConceded),
        eventsByType
      }
    })
  } catch (error) {
    console.error("Erro ao buscar partidas para relatório compartilhado:", error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 