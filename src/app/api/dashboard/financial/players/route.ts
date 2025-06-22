import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Player, Payment, MonthlyFeeException } from '@prisma/client'

interface PlayerWithRelations extends Player {
  feeException: MonthlyFeeException | null
  payments: Payment[]
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        team: true,
      },
    })

    if (!teamUser?.team) {
      return NextResponse.json(
        { message: 'Time não encontrado' },
        { status: 404 }
      )
    }

    // Buscar jogadores do time com suas exceções de mensalidade
    const players = await prisma.player.findMany({
      where: {
        teamId: teamUser.team.id,
        status: 'ACTIVE', // Apenas jogadores ativos
      },
      include: {
        feeException: true,
        payments: {
          orderBy: {
            dueDate: 'desc'
          },
          take: 1
        }
      }
    })

    // Formatar os dados dos jogadores
    const formattedPlayers = players.map((player: PlayerWithRelations) => {
      const lastPayment = player.payments[0]
      const isExempt = !!player.feeException?.isExempt
      const monthlyFee = isExempt ? 0 : (player.feeException?.amount || 0)

      return {
        id: player.id,
        name: player.name,
        isExempt,
        monthlyFee,
        lastPaymentDate: lastPayment?.paymentDate || null,
        paymentStatus: lastPayment?.status || 'PENDING'
      }
    })

    return NextResponse.json(formattedPlayers)
  } catch (error) {
    console.error('Erro ao buscar jogadores:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, monthlyFee, isExempt } = body

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        team: true,
      },
    })

    if (!teamUser?.team) {
      return NextResponse.json(
        { message: 'Time não encontrado' },
        { status: 404 }
      )
    }

    // Criar o jogador
    const player = await prisma.player.create({
      data: {
        name,
        number: 0,
        position: 'N/A', // ou ajuste conforme necessário
        status: 'ACTIVE',
        teamId: teamUser.team.id,
      },
    })

    // Se o jogador for isento, criar a exceção
    if (isExempt) {
      await prisma.monthlyFeeException.create({
        data: {
          playerId: player.id,
          isExempt: true,
        },
      })
    }

    return NextResponse.json(player)
  } catch (error) {
    console.error('Erro ao cadastrar jogador:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 