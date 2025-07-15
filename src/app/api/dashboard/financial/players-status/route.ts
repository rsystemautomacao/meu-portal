import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// Função para calcular o status do pagamento
const getPaymentStatus = (player: any, dueDay: number, today: Date) => {
  const { payments, monthlyFeeExceptions, joinDate } = player

  // 1. Verificar isenção
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()
  
  const isExempt = monthlyFeeExceptions.some((ex: any) => 
    ex.month === currentMonth && ex.year === currentYear && ex.isExempt
  )
  
  if (isExempt) {
    return { status: 'exempt', daysLate: 0 }
  }

  // 2. Verificar se existe pagamento para o mês atual
  const currentPayment = payments.find(
    (p: any) => p.year === currentYear && p.month === currentMonth
  )

  if (currentPayment) {
    // Se existe pagamento, usar o status dele
    return { 
      status: currentPayment.status, 
      lastPaymentDate: currentPayment.paymentDate 
    }
  }

  // 3. Lógica para novos jogadores
  const playerJoinDate = new Date(joinDate)
  const joinYear = playerJoinDate.getFullYear()
  const joinMonth = playerJoinDate.getMonth() + 1
  
  // Se o jogador entrou neste mês, o vencimento é no próximo mês
  if (joinYear === currentYear && joinMonth === currentMonth) {
     const nextMonthDueDate = new Date(currentYear, currentMonth, dueDay)
    if (today <= nextMonthDueDate) {
      return { status: 'pending', daysLate: 0 } // Pendente, mas não atrasado
    }
  }

  // 4. Lógica para jogadores existentes sem pagamento no mês
  const dueDateForThisMonth = new Date(currentYear, currentMonth - 1, dueDay)
  if (today > dueDateForThisMonth) {
    const daysLate = Math.floor((today.getTime() - dueDateForThisMonth.getTime()) / (1000 * 60 * 60 * 24))
    return { status: daysLate > 20 ? 'veryLate' : 'late', daysLate }
  }

  // Se ainda não passou o vencimento, está pendente
  return { status: 'pending', daysLate: 0 }
}

// GET - Buscar status de pagamento dos jogadores
export async function GET(req: Request) {
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

    const dueDay = config?.day || 10
    const today = new Date()

    // Buscar jogadores com pagamentos e exceções
    const players = await prisma.player.findMany({
      where: { teamId: teamUser.teamId },
      include: {
        payments: {
          where: {
            year: today.getFullYear(),
            month: today.getMonth() + 1
          }
        },
        monthlyFeeExceptions: {
          where: {
            year: today.getFullYear(),
            month: today.getMonth() + 1
          }
        }
      }
    })

    const playersWithStatus = players.map(player => {
      const { status, lastPaymentDate } = getPaymentStatus(player, dueDay, today)
      
      return {
        id: player.id,
        name: player.name,
        monthlyFee: player.monthlyFee,
        dueDay,
        lastPaymentDate: lastPaymentDate || null,
        status
      }
    })

    return NextResponse.json(playersWithStatus)
  } catch (error) {
    console.error('Erro ao buscar status dos jogadores:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar status dos jogadores' },
      { status: 500 }
    )
  }
} 