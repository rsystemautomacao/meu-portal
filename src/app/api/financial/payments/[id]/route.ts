import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const paymentId = params.id
    const data = await request.json()
    const { status, paymentDate } = data

    // Buscar o pagamento
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        player: true,
        transaction: true
      }
    })
    
    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário tem permissão (mesmo time)
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id, teamId: payment.player.teamId }
    })
    if (!teamUser) {
      return NextResponse.json({ error: 'Sem permissão para alterar este pagamento' }, { status: 403 })
    }

    // Se o status está mudando para 'paid', criar transação
    if (status === 'paid' && payment.status !== 'paid') {
      // Criar transação de entrada
      const transaction = await prisma.transaction.create({
        data: {
          description: `Mensalidade - ${payment.month}/${payment.year}`,
          amount: payment.amount,
          type: 'income',
          date: new Date(),
          teamId: payment.player.teamId
        }
      })

      // Atualizar pagamento com nova transação
      const updated = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paid: true,
          transactionId: transaction.id
        }
      })
      
      return NextResponse.json(updated)
    }

    // Se o status está mudando de 'paid' para outro, remover transação
    if (payment.status === 'paid' && status !== 'paid') {
      // Remover transação se existir
      if (payment.transactionId) {
        try {
          await prisma.transaction.delete({ where: { id: payment.transactionId } })
        } catch (error) {
          console.error('Erro ao deletar transação:', error)
        }
      }

      // Atualizar pagamento removendo transactionId
      const updated = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status,
          paymentDate: null,
          paid: false,
          transactionId: undefined // Corrigido para undefined
        }
      })
      
      return NextResponse.json(updated)
    }

    // Para outros casos, apenas atualizar o status
    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        paymentDate: status === 'paid' ? (paymentDate ? new Date(paymentDate) : new Date()) : null,
        paid: status === 'paid'
      }
    })
    
    return NextResponse.json(updated)
  } catch (error) {
    // Tratamento especial para erro P2025 (registro não encontrado)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      console.warn('[AVISO] Pagamento não encontrado para update (P2025). Pode ter sido removido por outro usuário ou fluxo.');
      return NextResponse.json({ error: 'Pagamento não encontrado ou foi removido' }, { status: 404 })
    }
    // Demais erros continuam sendo logados normalmente
    console.error('Erro ao atualizar pagamento:', error)
    return NextResponse.json({ error: 'Erro ao atualizar pagamento' }, { status: 500 })
  }
} 