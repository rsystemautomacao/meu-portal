// Este arquivo foi desabilitado temporariamente
// Há problemas com o Prisma Client não reconhecendo o schema atual
// Será reativado após o deploy funcionar

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// POST - Gerar mensalidades para o mês atual
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

    // Buscar configuração de mensalidade
    const config = await prisma.monthlyFeeConfig.findUnique({
      where: { teamId: teamUser.teamId }
    })

    if (!config) {
      return NextResponse.json(
        { message: 'Configuração de mensalidade não encontrada' },
        { status: 400 }
      )
    }

    // Buscar jogadores ativos
    const players = await prisma.player.findMany({
      where: {
        teamId: teamUser.teamId,
        status: 'active'
      }
    })

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    // Verificar se já existem mensalidades para este mês
    const existingPayments = await prisma.payment.findMany({
      where: {
        player: {
          teamId: teamUser.teamId
        },
        month: currentMonth,
        year: currentYear
      }
    })

    if (existingPayments.length > 0) {
      return NextResponse.json(
        { message: 'Mensalidades já geradas para este mês' },
        { status: 400 }
      )
    }

    // Registrar a transação de receita total
    const transaction = await prisma.transaction.create({
      data: {
        description: `Mensalidades (${currentMonth}/${currentYear})`,
        amount: config.amount * players.length,
        date: new Date(),
        type: 'INCOME',
        teamId: teamUser.teamId
      }
    })

    // Gerar mensalidades para cada jogador
    const payments = await Promise.all(
      players.map(player => {
        const dueDate = new Date(currentYear, currentMonth - 1, config.day)
        
        return prisma.payment.create({
          data: {
            playerId: player.id,
            transactionId: transaction.id,
            amount: config.amount,
            dueDate,
            status: 'PENDING',
            month: currentMonth,
            year: currentYear
          }
        })
      })
    )

    return NextResponse.json({
      message: 'Mensalidades geradas com sucesso',
      payments
    })
  } catch (error) {
    console.error('Erro ao gerar mensalidades:', error)
    return NextResponse.json(
      { message: 'Erro ao gerar mensalidades' },
      { status: 500 }
    )
  }
} 