import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      include: { team: true },
    })

    if (!teamUser?.team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    const matches = await prisma.match.findMany({
      where: { teamId: teamUser.team.id },
      orderBy: { date: 'desc' },
      include: {
        stats: {
          include: {
            player: true
          }
        }
      }
    })

    return NextResponse.json(matches)
  } catch (error) {
    console.error('Erro ao buscar partidas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar partidas' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      include: { team: true },
    })

    if (!teamUser?.team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    const data = await request.json()
    const { date, opponent, score } = data

    const match = await prisma.match.create({
      data: {
        date: new Date(date),
        opponent,
        score,
        teamId: teamUser.team.id
      }
    })

    return NextResponse.json(match)
  } catch (error) {
    console.error('Erro ao criar partida:', error)
    return NextResponse.json(
      { error: 'Erro ao criar partida' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { id, date, opponent, score } = data

    const match = await prisma.match.update({
      where: { id },
      data: {
        date: new Date(date),
        opponent,
        score
      }
    })

    return NextResponse.json(match)
  } catch (error) {
    console.error('Erro ao atualizar partida:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar partida' },
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID da partida não fornecido' },
        { status: 400 }
      )
    }

    // Usar uma transação para garantir que todos os dados relacionados sejam excluídos primeiro
    await prisma.$transaction(async (tx) => {
      // 1. Excluir estatísticas da partida
      await tx.matchStats.deleteMany({
        where: { matchId: id },
      })

      // 2. Excluir a súmula da partida
      await tx.matchSheet.deleteMany({
        where: { matchId: id },
      })

      // 3. Excluir a partida
      await tx.match.delete({
        where: { id },
      })
    })

    return NextResponse.json({ success: true, message: 'Partida excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir partida:', error)
    // Fornecer um erro mais específico se for um erro conhecido do Prisma
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
       return NextResponse.json(
        { error: 'Partida não encontrada para exclusão' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Ocorreu um erro ao excluir a partida e seus dados relacionados.' },
      { status: 500 }
    )
  }
} 