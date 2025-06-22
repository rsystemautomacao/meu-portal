import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Player } from '@prisma/client'

// Função para calcular o status do pagamento
const getPaymentStatus = (player: any, dueDay: number, today: Date) => {
  const { payments, feeException, joinDate } = player

  // 1. Verificar isenção
  if (feeException?.isExempt) {
    return { status: 'exempt', daysLate: 0 }
  }

  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1

  // 2. Verificar se o pagamento do mês atual foi feito
  const paidThisMonth = payments.find(
    (p: any) => p.year === currentYear && p.month === currentMonth && p.status === 'PAID'
  )
  if (paidThisMonth) {
    return { status: 'paid', lastPaymentDate: paidThisMonth.paymentDate }
  }

  // 3. Lógica para novos jogadores
  const playerJoinDate = new Date(joinDate)
  const joinYear = playerJoinDate.getFullYear()
  const joinMonth = playerJoinDate.getMonth() + 1
  
  // Se o jogador entrou neste mês, o vencimento é no próximo mês
  if (joinYear === currentYear && joinMonth === currentMonth) {
     const nextMonthDueDate = new Date(currentYear, currentMonth, dueDay); // Vencimento é dia 10 do mês seguinte
    if (today <= nextMonthDueDate) {
      return { status: 'pending', daysLate: 0 } // Pendente, mas não atrasado
    }
  }

  // 4. Lógica para jogadores existentes sem pagamento no mês
  const dueDateForThisMonth = new Date(currentYear, currentMonth - 1, dueDay)
  if (today > dueDateForThisMonth) {
    const daysLate = Math.floor((today.getTime() - dueDateForThisMonth.getTime()) / (1000 * 60 * 60 * 24));
    return { status: daysLate > 20 ? 'veryLate' : 'late', daysLate }
  }

  // Se ainda não passou o vencimento, está pendente
  return { status: 'pending', daysLate: 0 }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      include: {
        team: {
          include: {
            monthlyFeeConfig: true,
            players: {
              include: {
                payments: true,
                feeException: true,
              },
            },
          },
        },
      },
    })

    if (!teamUser || !teamUser.team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    const { players, monthlyFeeConfig } = teamUser.team
    const dueDay = monthlyFeeConfig?.dueDay || 10
    const today = new Date()

    const playersWithStatus = players.map((player: any) => {
        const { status, lastPaymentDate, daysLate } = getPaymentStatus(player, dueDay, today);
        
        const lastPaymentOverall = player.payments
            .filter((p: any) => p.status === 'PAID')
            .sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];

        return {
            id: player.id,
            name: player.name,
            monthlyFee: player.monthlyFee,
            dueDay: dueDay,
            lastPaymentDate: lastPaymentOverall?.paymentDate?.toISOString() || null,
            status: status,
            daysLate: daysLate || 0
        }
    });

    return NextResponse.json(playersWithStatus)
  } catch (error) {
    console.error("Erro ao buscar status dos jogadores:", error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao buscar status' },
      { status: 500 }
    )
  }
} 