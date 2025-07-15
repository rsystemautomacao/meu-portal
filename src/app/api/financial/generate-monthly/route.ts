import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Gerar mensalidades para o mês atual
export async function POST(req: Request) {
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

    // Buscar configuração de mensalidade
    const config = await prisma.monthlyFeeConfig.findUnique({
      where: { teamId: teamUser.teamId }
    })

    if (!config) {
      return NextResponse.json(
        { error: 'Configuração de mensalidade não encontrada' },
        { status: 404 }
      )
    }

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const dueDay = config.day
    const dueDate = new Date(currentYear, currentMonth - 1, dueDay)

    // Buscar jogadores ativos
    const players = await prisma.player.findMany({
      where: { 
        teamId: teamUser.teamId,
        status: 'ACTIVE'
      },
      include: {
        monthlyFeeExceptions: {
          where: {
            month: currentMonth,
            year: currentYear
          }
        }
      }
    })

    // Filtrar jogadores que não estão isentos
    const eligiblePlayers = players.filter(player => {
      const isExempt = player.monthlyFeeExceptions.some(ex => ex.isExempt)
      return !isExempt && player.monthlyFee > 0
    })

    if (eligiblePlayers.length === 0) {
      return NextResponse.json(
        { message: 'Nenhum jogador elegível para mensalidade' },
        { status: 200 }
      )
    }

    // Criar transação para o pagamento
    const totalAmount = eligiblePlayers.reduce((sum, player) => sum + player.monthlyFee, 0)
    
    const transaction = await prisma.transaction.create({
      data: {
        description: `Mensalidade - ${currentMonth}/${currentYear}`,
        amount: totalAmount,
        type: 'income',
        date: new Date(),
        teamId: teamUser.teamId
      }
    })

    // Criar pagamentos para cada jogador
    const payments = await Promise.all(
      eligiblePlayers.map(async (player) => {
        return await prisma.payment.create({
          data: {
            playerId: player.id,
            month: currentMonth,
            year: currentYear,
            amount: player.monthlyFee,
            paid: false,
            transactionId: transaction.id,
            dueDate,
            status: 'PENDING'
          }
        })
      })
    )

    return NextResponse.json({
      transaction,
      payments,
      message: `${payments.length} mensalidade(s) gerada(s) com sucesso`
    })
  } catch (error) {
    console.error('Erro ao gerar mensalidades:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar mensalidades' },
      { status: 500 }
    )
  }
} 