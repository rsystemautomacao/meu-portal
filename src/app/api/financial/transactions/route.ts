import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET - Listar transações
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      select: { teamId: true }
    })

    if (!teamUser) {
      return NextResponse.json(
        { message: 'Time não encontrado' },
        { status: 404 }
      )
    }

    const transactions = await prisma.transaction.findMany({
      where: { teamId: teamUser.teamId },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar transações' },
      { status: 500 }
    )
  }
}

// POST - Criar nova transação
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const data = await req.json()

    const teamUser = await prisma.teamUser.findFirst({
      where: { 
        userId: session.user.id,
        role: 'owner'
      },
      select: { teamId: true }
    })

    if (!teamUser) {
      return NextResponse.json(
        { message: 'Time não encontrado ou usuário não é proprietário' },
        { status: 404 }
      )
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        teamId: teamUser.teamId
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Erro ao criar transação:', error)
    return NextResponse.json(
      { message: 'Erro ao criar transação' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir transação
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { message: 'ID da transação não fornecido' },
        { status: 400 }
      )
    }

    const teamUser = await prisma.teamUser.findFirst({
      where: { 
        userId: session.user.id,
        role: 'owner'
      },
      select: { teamId: true }
    })

    if (!teamUser) {
      return NextResponse.json(
        { message: 'Time não encontrado ou usuário não é proprietário' },
        { status: 404 }
      )
    }

    // Verificar se a transação pertence ao time
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        teamId: teamUser.teamId
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { message: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    await prisma.transaction.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Transação excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir transação:', error)
    return NextResponse.json(
      { message: 'Erro ao excluir transação' },
      { status: 500 }
    )
  }
} 