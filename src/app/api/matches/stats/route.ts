import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { matchId, playerId, goals, assists, yellowCards, redCards } = data

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      include: { team: true },
    })

    if (!teamUser?.team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        teamId: teamUser.team.id
      }
    })

    if (!player) {
      return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 })
    }

    // Verifica se a partida pertence ao time do usuário
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        teamId: teamUser.team.id
      }
    })

    if (!match) {
      return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 })
    }

    // Cria ou atualiza as estatísticas
    const stats = await prisma.matchStats.upsert({
      where: {
        matchId_playerId: {
          matchId,
          playerId
        }
      },
      update: {
        goals,
        assists,
        yellowCards,
        redCards
      },
      create: {
        matchId,
        playerId,
        goals,
        assists,
        yellowCards,
        redCards
      }
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erro ao salvar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar estatísticas' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')
    const playerId = searchParams.get('playerId')

    if (!matchId || !playerId) {
      return NextResponse.json(
        { error: 'IDs da partida e jogador são necessários' },
        { status: 400 }
      )
    }

    await prisma.matchStats.delete({
      where: {
        matchId_playerId: {
          matchId,
          playerId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir estatísticas' },
      { status: 500 }
    )
  }
} 