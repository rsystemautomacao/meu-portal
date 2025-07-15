import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

    // Buscar todas as transações do time
    const transactions = await prisma.transaction.findMany({
      where: {
        teamId: teamUser.teamId
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Formatar os dados para garantir consistência
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type.toUpperCase() as 'INCOME' | 'EXPENSE',
      date: transaction.date.toISOString()
    }))

    return NextResponse.json(formattedTransactions)
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
      { status: 500 }
    )
  }
}

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
    console.log('Dados recebidos:', data)

    // Validações
    if (!data.description || !data.amount || !data.type || !data.date) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (data.type.toLowerCase() !== 'income' && data.type.toLowerCase() !== 'expense') {
      return NextResponse.json(
        { error: 'Tipo de transação inválido' },
        { status: 400 }
      )
    }

    const amount = parseFloat(data.amount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Valor inválido' },
        { status: 400 }
      )
    }

    // Criar a transação
    const transaction = await prisma.transaction.create({
      data: {
        description: data.description,
        amount: amount,
        type: data.type.toLowerCase(), // Garantir que seja minúsculo
        date: new Date(data.date),
        teamId: teamUser.teamId
      }
    })

    console.log('Transação criada:', transaction)
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Erro ao criar transação:', error)
    return NextResponse.json(
      { error: 'Erro ao criar transação' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID da transação não fornecido' },
        { status: 400 }
      )
    }

    // Verificar se a transação pertence ao time do usuário
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            users: {
              where: {
                userId: session.user.id,
                role: 'owner'
              }
            }
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    if (transaction.team.users.length === 0) {
      return NextResponse.json(
        { error: 'Não autorizado a remover esta transação' },
        { status: 403 }
      )
    }

    await prisma.transaction.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Transação removida com sucesso' })
  } catch (error) {
    console.error('Erro ao remover transação:', error)
    return NextResponse.json(
      { error: 'Erro ao remover transação' },
      { status: 500 }
    )
  }
} 