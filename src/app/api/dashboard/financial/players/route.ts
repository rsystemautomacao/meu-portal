import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Buscar jogadores para o módulo financeiro
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

    // Buscar jogadores ativos
    const players = await prisma.player.findMany({
      where: { 
        teamId: teamUser.teamId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        number: true,
        monthlyFee: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(players)
  } catch (error) {
    console.error('Erro ao buscar jogadores:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar jogadores' },
      { status: 500 }
    )
  }
}

// POST - Criar jogador (se necessário)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { name, monthlyFee } = data

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      select: { teamId: true }
    })
    if (!teamUser) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    // Criar jogador
    const player = await prisma.player.create({
      data: {
        name,
        position: 'Jogador',
        monthlyFee: monthlyFee ? parseFloat(monthlyFee) : 0,
        teamId: teamUser.teamId
      }
    })

    return NextResponse.json(player)
  } catch (error) {
    console.error('Erro ao criar jogador:', error)
    return NextResponse.json(
      { error: 'Erro ao criar jogador' },
      { status: 500 }
    )
  }
} 