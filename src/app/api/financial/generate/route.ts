import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Player } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { month, year, amount, dueDay } = data

    // Validar dados obrigatórios
    if (!month || !year || !amount || !dueDay) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
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
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    // Buscar todos os jogadores ativos do time
    const players = await prisma.player.findMany({
      where: {
        teamId: teamUser.teamId,
        status: 'active',
      },
    })

    if (players.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum jogador ativo encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já existem mensalidades para o mês/ano
    const existingPayments = await prisma.payment.findMany({
      where: {
        player: {
          teamId: teamUser.teamId,
        },
        month: month,
        year: year,
      },
    })

    if (existingPayments.length > 0) {
      return NextResponse.json(
        { error: 'Já existem mensalidades geradas para este mês' },
        { status: 400 }
      )
    }

    // Criar a data de vencimento
    const dueDate = new Date(year, month - 1, dueDay)

    // Gerar mensalidades para todos os jogadores
    const payments = await Promise.all(
      players.map((player: Player) =>
        prisma.payment.create({
          data: {
            playerId: player.id,
            amount: amount,
            dueDate: dueDate,
            status: 'pending',
            month: month,
            year: year,
          },
        })
      )
    )

    return NextResponse.json({
      message: `${payments.length} mensalidades geradas com sucesso`,
      payments,
    })
  } catch (error) {
    console.error('Erro ao gerar mensalidades:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar mensalidades' },
      { status: 500 }
    )
  }
} 