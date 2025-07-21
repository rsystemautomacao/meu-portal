import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MessagingService } from '@/lib/messaging'

// GET - Verificar status de pagamento do time
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id

    // Buscar dados do time
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        transactions: {
          where: {
            type: 'income'
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Time não encontrado' },
        { status: 404 }
      )
    }

    // Verificar status de pagamento usando o serviço
    const paymentStatus = await MessagingService.checkPaymentStatus(teamId)

    // Calcular receita total
    const totalRevenue = team.transactions.reduce((sum, transaction) => sum + transaction.amount, 0)

    // Determinar se está em atraso
    const isOverdue = paymentStatus.daysOverdue > 10
    const shouldBlock = paymentStatus.daysOverdue > 30

    return NextResponse.json({
      teamId: team.id,
      teamName: team.name,
      paymentStatus,
      totalRevenue,
      isOverdue,
      shouldBlock,
      lastPayment: team.transactions[0] || null
    })
  } catch (error) {
    console.error('Erro ao verificar status de pagamento:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar status de pagamento' },
      { status: 500 }
    )
  }
} 