import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET - Listar exceções
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      select: { teamId: true }
    })

    if (!teamUser) {
      return NextResponse.json(
        { message: 'Time não encontrado' },
        { status: 404 }
      )
    }

    const exceptions = await prisma.monthlyFeeException.findMany({
      where: {
        player: {
          teamId: teamUser.teamId
        }
      },
      include: {
        player: {
          select: {
            name: true,
            number: true
          }
        }
      }
    })

    return NextResponse.json(exceptions)
  } catch (error) {
    console.error('Erro ao buscar exceções:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar exceções' },
      { status: 500 }
    )
  }
}

// POST - Criar/Atualizar exceções
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const teamUser = await prisma.teamUser.findFirst({
      where: { 
        userId: session.user.id,
        role: 'owner'
      },
      select: { teamId: true }
    })

    if (!teamUser) {
      return NextResponse.json(
        { message: 'Time não encontrado ou usuário não é proprietário' },
        { status: 404 }
      )
    }

    const exceptions = await req.json()

    // Verificar se todos os jogadores pertencem ao time
    const playerIds = exceptions.map((e: any) => e.playerId)
    const players = await prisma.player.findMany({
      where: {
        id: { in: playerIds },
        teamId: teamUser.teamId
      }
    })

    if (players.length !== playerIds.length) {
      return NextResponse.json(
        { message: 'Um ou mais jogadores não pertencem ao time' },
        { status: 400 }
      )
    }

    // Deletar exceções antigas
    await prisma.monthlyFeeException.deleteMany({
      where: {
        player: {
          teamId: teamUser.teamId
        }
      }
    })

    // Criar novas exceções
    const createdExceptions = await Promise.all(
      exceptions.map((exception: any) =>
        prisma.monthlyFeeException.create({
          data: {
            playerId: exception.playerId,
            amount: exception.amount,
            isExempt: exception.isExempt
          },
          include: {
            player: {
              select: {
                name: true,
                number: true
              }
            }
          }
        })
      )
    )

    return NextResponse.json(createdExceptions)
  } catch (error) {
    console.error('Erro ao salvar exceções:', error)
    return NextResponse.json(
      { message: 'Erro ao salvar exceções' },
      { status: 500 }
    )
  }
}

// DELETE - Remover exceção
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { message: 'ID da exceção não fornecido' },
        { status: 400 }
      )
    }

    const teamUser = await prisma.teamUser.findFirst({
      where: { 
        userId: session.user.id,
        role: 'owner'
      },
      select: { teamId: true }
    })

    if (!teamUser) {
      return NextResponse.json(
        { message: 'Time não encontrado ou usuário não é proprietário' },
        { status: 404 }
      )
    }

    // Verificar se a exceção pertence ao time
    const exception = await prisma.monthlyFeeException.findFirst({
      where: {
        id,
        player: {
          teamId: teamUser.teamId
        }
      }
    })

    if (!exception) {
      return NextResponse.json(
        { message: 'Exceção não encontrada' },
        { status: 404 }
      )
    }

    await prisma.monthlyFeeException.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Exceção removida com sucesso' })
  } catch (error) {
    console.error('Erro ao remover exceção:', error)
    return NextResponse.json(
      { message: 'Erro ao remover exceção' },
      { status: 500 }
    )
  }
} 