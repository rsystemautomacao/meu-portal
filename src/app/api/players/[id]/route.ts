import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { name, position, status, birthDate, monthlyFee, isExempt } = data

    if (!name || !position || !status) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (!isExempt && (!monthlyFee || monthlyFee <= 0)) {
      return NextResponse.json(
        { error: 'Mensalidade é obrigatória quando o jogador não está isento' },
        { status: 400 }
      )
    }

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: {
        userId: session.user.id,
        role: {
          in: ["owner", "admin"]
        }
      },
      include: {
        team: true
      }
    })

    if (!teamUser) {
      return NextResponse.json(
        { error: 'Usuário não tem permissão para atualizar jogadores' },
        { status: 403 }
      )
    }

    // Buscar o jogador
    const player = await prisma.player.findUnique({
      where: { id: params.id },
      include: {
        monthlyFeeExceptions: true
      }
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Jogador não encontrado' },
        { status: 404 }
      )
    }

    if (player.teamId !== teamUser.teamId) {
      return NextResponse.json(
        { error: 'Jogador não pertence ao seu time' },
        { status: 403 }
      )
    }

    // Atualizar o jogador
    const updatedPlayer = await prisma.player.update({
      where: { id: params.id },
      data: {
        name,
        position,
        status,
        birthDate: birthDate ? new Date(birthDate) : null
      },
      include: {
        monthlyFeeExceptions: true
      }
    })

    // Atualizar ou criar exceção de mensalidade
    if (isExempt) {
      if (!player.feeException) {
        await prisma.monthlyFeeException.create({
          data: {
            playerId: player.id,
            isExempt: true,
            amount: 0
          }
        })
      }
    } else if (player.feeException) {
      await prisma.monthlyFeeException.delete({
        where: { playerId: player.id }
      })
    }

    return NextResponse.json(updatedPlayer)
  } catch (error) {
    console.error('Erro ao atualizar jogador:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar jogador' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const playerId = params.id

    // Verificar se o jogador pertence ao time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        team: {
          include: {
            players: {
              where: {
                id: playerId,
              },
            },
          },
        },
      },
    })

    if (!teamUser?.team || teamUser.team.players.length === 0) {
      return NextResponse.json(
        { message: 'Jogador não encontrado' },
        { status: 404 }
      )
    }

    // Excluir exceções de mensalidade primeiro
    await prisma.monthlyFeeException.deleteMany({
      where: {
        playerId: playerId,
      },
    })

    // Excluir pagamentos relacionados ao jogador
    await prisma.payment.deleteMany({
      where: {
        playerId: playerId,
      },
    })

    // Excluir estatísticas de partidas do jogador
    await prisma.matchStats.deleteMany({
      where: {
        playerId: playerId,
      },
    })

    // Excluir o jogador
    await prisma.player.delete({
      where: {
        id: playerId,
      },
    })

    return NextResponse.json(
      { message: 'Jogador excluído com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao excluir jogador:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 