import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Função para calcular o status do pagamento
const getPaymentStatus = (player: any, dueDay: number, today: Date) => {
  const { payments, monthlyFeeExceptions, joinDate } = player

  // 1. Verificar isenção para este mês específico
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()
  
  const isExemptForMonth = monthlyFeeExceptions.some((ex: any) => 
    ex.month === currentMonth && ex.year === currentYear && ex.isExempt
  )
  
  if (isExemptForMonth) {
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

// GET: Buscar status de pagamento dos jogadores para relatório compartilhado
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Validar token de compartilhamento
    const sharedReport = await prisma.sharedReport.findUnique({
      where: { shareToken: token },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!sharedReport || !sharedReport.isActive) {
      return NextResponse.json({ error: 'Relatório não encontrado ou inativo' }, { status: 404 })
    }

    // Buscar configuração de mensalidade
    const config = await prisma.monthlyFeeConfig.findUnique({
      where: { teamId: sharedReport.team.id }
    })

    const dueDay = config?.day || 10
    const today = new Date()

    // Buscar jogadores com pagamentos e exceções
    const players = await prisma.player.findMany({
      where: { teamId: sharedReport.team.id },
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
      // Jogador isento global (no cadastro)
      const isGloballyExempt = player.isExempt === true
      const { status, lastPaymentDate } = isGloballyExempt
        ? { status: 'exempt', lastPaymentDate: null }
        : getPaymentStatus(player, dueDay, today)
      const isExempt = status === 'exempt' || isGloballyExempt
      return {
        id: player.id,
        name: player.name,
        monthlyFee: player.monthlyFee,
        dueDay,
        lastPaymentDate: lastPaymentDate || null,
        status,
        isExempt
      }
    })

    return NextResponse.json({
      players: playersWithStatus
    })
  } catch (error) {
    console.error('Erro ao buscar status dos jogadores para relatório compartilhado:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar status dos jogadores' },
      { status: 500 }
    )
  }
} 