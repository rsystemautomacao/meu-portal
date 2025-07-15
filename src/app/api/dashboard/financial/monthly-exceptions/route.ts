import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      select: { teamId: true }
    })
    if (!teamUser) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    // Buscar todas as exceções do time
    const exceptions = await prisma.monthlyFeeException.findMany({
      where: {
        teamId: teamUser.teamId
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
      { error: 'Erro ao buscar exceções' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log('Iniciando POST de exceções...')
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      select: { teamId: true }
    })
    if (!teamUser) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    const exceptions = await request.json()
    console.log('Exceções recebidas:', exceptions)

    // Validar se todos os jogadores pertencem ao time
    const playerIds = exceptions.map((e: any) => e.playerId).filter(Boolean)
    console.log('IDs dos jogadores:', playerIds)

    const players = await prisma.player.findMany({
      where: {
        id: { in: playerIds },
        teamId: teamUser.teamId
      }
    })
    console.log('Jogadores encontrados:', players.length)

    if (players.length !== playerIds.length) {
      return NextResponse.json(
        { error: 'Alguns jogadores não pertencem ao time' },
        { status: 400 }
      )
    }

    // Remover todas as exceções existentes do time
    console.log('Removendo exceções existentes...')
    const deletedExceptions = await prisma.monthlyFeeException.deleteMany({
      where: {
        teamId: teamUser.teamId
      }
    })
    console.log('Exceções removidas:', deletedExceptions)

    // Criar as novas exceções
    console.log('Criando novas exceções...')
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const validExceptions = exceptions
      .filter((e: any) => e.playerId) // Ignorar exceções sem playerId
      .map((exception: any) => ({
        teamId: teamUser.teamId,
        playerId: exception.playerId,
        month: currentMonth,
        year: currentYear,
        amount: exception.amount ? parseFloat(exception.amount) : null,
        isExempt: Boolean(exception.isExempt)
      }))

    console.log('Exceções válidas:', validExceptions)

    const createdExceptions = await Promise.all(
      validExceptions.map(async (exception: any) => {
        try {
          return await prisma.monthlyFeeException.create({
            data: exception,
            include: {
              player: {
                select: {
                  name: true,
                  number: true
                }
              }
            }
          })
        } catch (error) {
          console.error('Erro ao criar exceção:', error, exception)
          throw error
        }
      })
    )

    console.log('Exceções criadas com sucesso:', createdExceptions)
    return NextResponse.json(createdExceptions)
  } catch (error) {
    console.error('Erro ao salvar exceções:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao salvar exceções',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID da exceção não fornecido' },
        { status: 400 }
      )
    }

    // Verificar se a exceção pertence ao time do usuário
    const exception = await prisma.monthlyFeeException.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            users: {
              where: {
                userId: session.user.id,
                role: 'owner'
              }
            }
          }
        }
      }
    })

    if (!exception) {
      return NextResponse.json(
        { error: 'Exceção não encontrada' },
        { status: 404 }
      )
    }

    if (exception.team.users.length === 0) {
      return NextResponse.json(
        { error: 'Não autorizado a remover esta exceção' },
        { status: 403 }
      )
    }

    await prisma.monthlyFeeException.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Exceção removida com sucesso' })
  } catch (error) {
    console.error('Erro ao remover exceção:', error)
    return NextResponse.json(
      { error: 'Erro ao remover exceção' },
      { status: 500 }
    )
  }
} 