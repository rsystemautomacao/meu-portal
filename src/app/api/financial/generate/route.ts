import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Gerar pagamentos para jogadores
export async function POST(request: Request) {
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

    const data = await request.json()
    const { playerIds, month, year, amount, status = 'paid' } = data

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return NextResponse.json(
        { error: 'Lista de jogadores é obrigatória' },
        { status: 400 }
      )
    }

    // Se status for isento/exempt, forçar amount para 0
    const isExempt = status === 'exempt' || status === 'isento'
    const finalAmount = isExempt ? 0 : parseFloat(amount)

    if (!month || !year || (!amount && !isExempt)) {
      return NextResponse.json(
        { error: 'Mês, ano e valor são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar configuração de mensalidade
    const config = await prisma.monthlyFeeConfig.findUnique({
      where: { teamId: teamUser.teamId }
    })

    const dueDay = config?.day || 10
    const dueDate = new Date(year, month - 1, dueDay)

    // Criar transação apenas se o status for 'paid'
    let transaction = null
    if (status === 'paid') {
      transaction = await prisma.transaction.create({
        data: {
          description: `Mensalidade - ${month}/${year}`,
          amount: finalAmount,
          type: 'income',
          date: new Date(),
          teamId: teamUser.teamId
        }
      })
    }

    // Log para depuração
    console.log('[PAGAMENTO] Recebido status:', status, 'amount:', amount, 'isExempt:', isExempt)

    // Criar pagamentos para cada jogador
    const payments = await Promise.all(
      playerIds.map(async (playerId: string) => {
        const paymentData: any = {
          playerId,
          month,
          year,
          amount: finalAmount,
          paid: status === 'paid' || isExempt,
          dueDate,
          status: isExempt ? 'exempt' : status
        }

        // Adicionar paymentDate apenas se for pago ou isento
        if (status === 'paid' || isExempt) {
          paymentData.paymentDate = new Date()
        }

        // Adicionar transactionId apenas se houver transação e não for isento
        if (transaction && !isExempt) {
          paymentData.transactionId = transaction.id
        }

        return await prisma.payment.create({
          data: paymentData
        })
      })
    )

    return NextResponse.json({
      transaction,
      payments,
      message: `${payments.length} pagamento(s) gerado(s) com sucesso`
    })
  } catch (error) {
    console.error('Erro ao gerar pagamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar pagamentos' },
      { status: 500 }
    )
  }
} 