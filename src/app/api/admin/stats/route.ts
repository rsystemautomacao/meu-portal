import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário é admin
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { message: 'Acesso negado. Apenas administradores podem acessar esta área.' },
        { status: 403 }
      )
    }

    // Buscar estatísticas
    const [
      totalUsers,
      totalTeams,
      totalPlayers,
      totalTransactions
    ] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.player.count(),
      prisma.transaction.count()
    ])

    return NextResponse.json({
      totalUsers,
      totalTeams,
      totalPlayers,
      totalTransactions
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
} 