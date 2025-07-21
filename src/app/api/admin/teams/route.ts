import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Buscar todos os times com estatísticas
export async function GET() {
  try {
    // Buscar todos os times com relacionamentos
    const teams = await prisma.team.findMany({
      include: {
        users: {
          include: {
            user: true
          }
        },
        players: true,
        transactions: {
          where: {
            type: 'income'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Processar dados dos times
    const teamsWithStats = teams.map((team: any) => {
      const userCount = team.users.length
      const playerCount = team.players.length
      const totalRevenue = team.transactions.reduce((sum: number, transaction: any) => sum + transaction.amount, 0)

      return {
        id: team.id,
        name: team.name,
        whatsapp: team.whatsapp,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        logo: team.logo,
        createdAt: team.createdAt.toISOString(),
        userCount,
        playerCount,
        totalRevenue,
        status: 'ACTIVE' // Por enquanto, depois implementaremos status
      }
    })

    return NextResponse.json({
      teams: teamsWithStats,
      total: teamsWithStats.length
    })
  } catch (error) {
    console.error('Erro ao buscar times:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar times' },
      { status: 500 }
    )
  }
} 