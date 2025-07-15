import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Buscar partida específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const match = await prisma.match.findFirst({
      where: { 
        id: params.id,
        team: {
          users: {
            some: {
              userId: session.user.id
            }
          }
        }
      },
      include: {
        events: true
      }
    })

    if (!match) {
      return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 })
    }

    return NextResponse.json(match)
  } catch (error) {
    console.error('Erro ao buscar partida:', error)
    return NextResponse.json({ error: 'Erro ao buscar partida' }, { status: 500 })
  }
}

// PUT - Atualizar partida
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { 
      date, 
      opponent, 
      location, 
      ourScore, 
      opponentScore,
      ourScore1,
      opponentScore1,
      ourScore2,
      opponentScore2,
      events = [] // Novo campo para eventos
    } = data

    // Verificar se a partida pertence ao time do usuário
    const existingMatch = await prisma.match.findFirst({
      where: { 
        id: params.id,
        team: {
          users: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    })

    if (!existingMatch) {
      return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 })
    }

    // Atualizar partida com eventos
    const updatedMatch = await prisma.match.update({
      where: { id: params.id },
      data: {
        date: date ? new Date(date) : undefined,
        opponent,
        location,
        ourScore: ourScore !== undefined ? Number(ourScore) : undefined,
        opponentScore: opponentScore !== undefined ? Number(opponentScore) : undefined,
        ourScore1: ourScore1 !== undefined ? Number(ourScore1) : undefined,
        opponentScore1: opponentScore1 !== undefined ? Number(opponentScore1) : undefined,
        ourScore2: ourScore2 !== undefined ? Number(ourScore2) : undefined,
        opponentScore2: opponentScore2 !== undefined ? Number(opponentScore2) : undefined,
      },
      include: {
        events: true
      }
    })

    // Se há eventos para atualizar, primeiro deletar os existentes e criar os novos
    if (events.length > 0) {
      // Deletar eventos existentes
      await prisma.matchEvent.deleteMany({
        where: { matchId: params.id }
      })

      // Criar novos eventos
      await prisma.matchEvent.createMany({
        data: events.map((event: any) => ({
          matchId: params.id,
          type: event.type,
          player: event.player,
          minute: event.minute,
          team: event.team,
          quadro: event.quadro,
          assist: event.assist
        }))
      })

      // Buscar partida atualizada com eventos
      const matchWithEvents = await prisma.match.findUnique({
        where: { id: params.id },
        include: {
          events: true
        }
      })

      return NextResponse.json(matchWithEvents)
    }

    return NextResponse.json(updatedMatch)
  } catch (error) {
    console.error('Erro ao atualizar partida:', error)
    return NextResponse.json({ error: 'Erro ao atualizar partida' }, { status: 500 })
  }
}

// DELETE - Excluir partida
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se a partida pertence ao time do usuário
    const existingMatch = await prisma.match.findFirst({
      where: { 
        id: params.id,
        team: {
          users: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    })

    if (!existingMatch) {
      return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 })
    }

    // Excluir partida (os eventos serão excluídos automaticamente devido ao cascade)
    await prisma.match.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir partida:', error)
    return NextResponse.json({ error: 'Erro ao excluir partida' }, { status: 500 })
  }
} 