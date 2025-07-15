import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shareToken = searchParams.get('shareToken')
    
    if (!shareToken) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }

    // Buscar a partida pelo shareToken
    const match = await prisma.match.findFirst({
      where: { shareToken },
      include: { team: true }
    })

    if (!match) {
      return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 })
    }

    // Buscar jogadores do time da partida
    const players = await prisma.player.findMany({
      where: { 
        teamId: match.teamId,
        status: 'ACTIVE' // Apenas jogadores ativos
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(players)
  } catch (error) {
    console.error('Erro ao buscar jogadores:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 