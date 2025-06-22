import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar o time do usuário
    const team = await prisma.team.findFirst({
      where: {
        users: {
          some: {
            userId: session.user.id,
            role: 'owner'
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    // Buscar todas as transações do time
    const transactions = await prisma.transaction.findMany({
      where: {
        teamId: team.id
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(transactions)
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
    const team = await prisma.team.findFirst({
      where: {
        users: {
          some: {
            userId: session.user.id,
            role: 'owner'
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    const data = await request.json()
    console.log('Dados recebidos:', data)

    // Criar a transação
    const transaction = await prisma.transaction.create({
      data: {
        description: data.description,
        amount: parseFloat(data.amount),
        type: data.type,
        date: new Date(data.date),
        teamId: team.id
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