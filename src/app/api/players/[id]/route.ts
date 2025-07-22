import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
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
        { error: 'Usuário não tem permissão para visualizar jogadores' },
        { status: 403 }
      )
    }

    // Buscar o jogador
    const player = await prisma.player.findUnique({
      where: { id: params.id },
      include: {
        payments: {
          where: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
        },
        monthlyFeeExceptions: {
          where: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
        },
      },
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

    return NextResponse.json(player)
  } catch (error) {
    console.error('Erro ao buscar jogador:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar jogador' },
      { status: 500 }
    )
  }
}

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
    const { name, position, status, birthDate, joinDate, number, photoUrl, monthlyFee, isExempt } = data

    if (!name || !position || !status) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
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
        monthlyFeeExceptions: {
          where: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
        },
      },
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
        number: number ? Number(number) : null,
        photoUrl: photoUrl || null,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        joinDate: joinDate ? new Date(joinDate) : undefined,
        monthlyFee: monthlyFee ? Number(monthlyFee) : 0,
        isExempt: !!isExempt
      },
      include: {
        monthlyFeeExceptions: {
          where: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
        },
      },
    })

    // Atualizar ou criar exceção de mensalidade
    if (isExempt !== undefined) {
      // Deletar exceção existente se houver
      await prisma.monthlyFeeException.deleteMany({
        where: {
          playerId: player.id,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
      })

      // Criar nova exceção se for isento
      if (isExempt) {
        await prisma.monthlyFeeException.create({
          data: {
            teamId: teamUser.teamId,
            playerId: player.id,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            isExempt: true,
          }
        })
      }
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

    // Excluir o jogador (as exceções e pagamentos já foram deletados)
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