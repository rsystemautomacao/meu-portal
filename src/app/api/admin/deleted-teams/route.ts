import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Buscar times excluídos pelos clientes
export async function GET(request: Request) {
  try {
    console.log('🔍 API /api/admin/deleted-teams chamada')
    
    const deletedTeams = await prisma.deletedTeamAnalytics.findMany({
      orderBy: {
        deletedAt: 'desc'
      }
    })

    console.log(`📊 Times excluídos encontrados: ${deletedTeams.length}`)
    deletedTeams.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.teamName} - Excluído por: ${team.deletedBy} - Data: ${team.deletedAt}`)
    })

    return NextResponse.json({
      deletedTeams,
      total: deletedTeams.length
    })
  } catch (error) {
    console.error('❌ Erro ao buscar times excluídos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar times excluídos' },
      { status: 500 }
    )
  }
} 