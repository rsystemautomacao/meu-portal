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
  if (!joinDate) {
    // Se não tem data de entrada, usar lógica padrão
    const dueDateForThisMonth = new Date(currentYear, currentMonth - 1, dueDay)
    if (today > dueDateForThisMonth) {
      const daysLate = Math.floor((today.getTime() - dueDateForThisMonth.getTime()) / (1000 * 60 * 60 * 24))
      return { status: daysLate > 20 ? 'veryLate' : 'late', daysLate }
    }
    return { status: 'pending', daysLate: 0 }
  }
  
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

    // Calcular jogadores com mensalidades em aberto há mais de um mês
    const playersWithOverdueFees = players
      .filter(player => {
        // Verificar se joinDate existe
        if (!player.joinDate) {
          return false // Se não tem data de entrada, não tem mensalidades em aberto
        }
        
        const playerJoinDate = new Date(player.joinDate)
        const joinYear = playerJoinDate.getFullYear()
        const joinMonth = playerJoinDate.getMonth() + 1
        
        // Se o jogador entrou neste mês, não tem mensalidades em aberto
        if (joinYear === today.getFullYear() && joinMonth === today.getMonth() + 1) {
          return false
        }

        // Verificar se tem pagamento para o mês atual
        const currentPayment = player.payments.find(
          (p: any) => p.year === today.getFullYear() && p.month === today.getMonth() + 1
        )

        // Se não tem pagamento para o mês atual, verificar se deveria ter
        if (!currentPayment) {
          const dueDateForThisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay)
          return today > dueDateForThisMonth
        }

        return false
      })
      .map(player => {
        const dueDateForThisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay)
        const daysLate = Math.floor((today.getTime() - dueDateForThisMonth.getTime()) / (1000 * 60 * 60 * 24))
        const monthsOverdue = Math.ceil(daysLate / 30)

        return {
          id: player.id,
          name: player.name,
          monthlyFee: player.monthlyFee,
          monthsOverdue: Math.max(1, monthsOverdue), // Mínimo 1 mês
          daysLate
        }
      })

    return NextResponse.json({
      players: playersWithStatus,
      playersWithOverdueFees
    })
  } catch (error) {
    console.error('Erro ao buscar status dos jogadores:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar status dos jogadores' },
      { status: 500 }
    )
  }
} 