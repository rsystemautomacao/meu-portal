import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Buscar débitos históricos
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

    // Buscar débitos históricos
    const historicalDebts = await prisma.historicalDebt.findMany({
      where: { teamId: teamUser.teamId },
      include: {
        player: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Formatar dados para retorno
    const formattedDebts = historicalDebts.map((debt: any) => ({
      id: debt.id,
      playerId: debt.playerId,
      playerName: debt.player.name,
      amount: debt.amount,
      month: debt.month,
      year: debt.year,
      description: debt.description,
      createdAt: debt.createdAt.toISOString()
    }))

    return NextResponse.json(formattedDebts)
  } catch (error) {
    console.error('Erro ao buscar débitos históricos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar débitos históricos' },
      { status: 500 }
    )
  }
}

// POST - Criar débito histórico
export async function POST(req: Request) {
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

    const { playerId, amount, month, year, description } = await req.json()

    // Validar dados
    if (!playerId || !amount || !month || !year) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Verificar se o jogador existe e pertence ao time
    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        teamId: teamUser.teamId
      }
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Jogador não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já existe débito para este jogador/mês/ano
    const existingDebt = await prisma.historicalDebt.findFirst({
      where: {
        playerId,
        month,
        year,
        teamId: teamUser.teamId
      }
    })

    if (existingDebt) {
      return NextResponse.json(
        { error: 'Já existe um débito histórico para este jogador neste mês/ano' },
        { status: 400 }
      )
    }

    // Criar débito histórico
    const historicalDebt = await prisma.historicalDebt.create({
      data: {
        playerId,
        teamId: teamUser.teamId,
        amount: parseFloat(amount),
        month: parseInt(month),
        year: parseInt(year),
        description: description || `Débito histórico - ${month}/${year}`
      },
      include: {
        player: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({
      id: historicalDebt.id,
      playerId: historicalDebt.playerId,
      playerName: historicalDebt.player.name,
      amount: historicalDebt.amount,
      month: historicalDebt.month,
      year: historicalDebt.year,
      description: historicalDebt.description,
      createdAt: historicalDebt.createdAt.toISOString()
    })
  } catch (error) {
    console.error('Erro ao criar débito histórico:', error)
    return NextResponse.json(
      { error: 'Erro ao criar débito histórico' },
      { status: 500 }
    )
  }
} 