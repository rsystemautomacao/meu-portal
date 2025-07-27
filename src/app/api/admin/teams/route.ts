import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Buscar todos os times com estatísticas
export async function GET(request: Request) {
  try {
    console.log('🔍 API /api/admin/teams chamada')
    
    const { searchParams } = new URL(request.url)
    const showDeleted = searchParams.get('showDeleted') === 'true'
    
    console.log('📋 Parâmetros:', { showDeleted })
    
    // Buscar todos os times primeiro, depois filtrar
    const allTeams = await prisma.team.findMany({
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

    console.log(`📊 Todos os times encontrados: ${allTeams.length}`)
    
    // Filtrar baseado no parâmetro showDeleted
    const teams = showDeleted ? allTeams : allTeams.filter(team => !team.deletedAt)
    
    console.log(`📊 Times após filtro: ${teams.length}`)
    teams.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.name} (${team.id}) - Status: ${team.status} - Deletado: ${!!team.deletedAt}`)
    })

    // Processar dados dos times
    const teamsWithStats = teams.map((team: any) => {
      const userCount = team.users.length
      const playerCount = team.players.length
      const totalRevenue = team.transactions.reduce((sum: number, transaction: any) => sum + transaction.amount, 0)
      const isDeleted = !!team.deletedAt
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
        status: isDeleted ? 'EXCLUIDO' : (team.status || 'ACTIVE'),
        deletedAt: team.deletedAt ? team.deletedAt.toISOString() : null
      }
    })

    console.log(`✅ Retornando ${teamsWithStats.length} times processados`)

    return NextResponse.json({
      teams: teamsWithStats,
      total: teamsWithStats.length
    })
  } catch (error) {
    console.error('❌ Erro ao buscar times:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar times' },
      { status: 500 }
    )
  }
} 