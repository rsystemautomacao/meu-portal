import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar jogadores do time do usuário logado
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      include: { team: true }
    })
    if (!teamUser) {
      return NextResponse.json({ error: 'Usuário não pertence a um time' }, { status: 403 })
    }

    // Listar jogadores do time
    const players = await prisma.player.findMany({
      where: { teamId: teamUser.teamId },
      include: {
        monthlyFeeExceptions: true,
        payments: true
      },
      orderBy: { name: 'asc' }
    })
    // Adicionar isExempt ao retorno
    const playersWithIsExempt = players.map(player => ({
      ...player,
      isExempt: !!player.isExempt
    }))
    return NextResponse.json(playersWithIsExempt)
  } catch (error) {
    console.error('Erro ao listar jogadores:', error)
    return NextResponse.json({ error: 'Erro ao listar jogadores' }, { status: 500 })
  }
}

// POST - Criar jogador no time do usuário logado
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const data = await request.json()
    const { name, position, number, photoUrl, birthDate, status, monthlyFee, isExempt } = data
    if (!name || !position) {
      return NextResponse.json({ error: 'Nome e posição são obrigatórios' }, { status: 400 })
    }
    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      include: { team: true }
    })
    if (!teamUser) {
      return NextResponse.json({ error: 'Usuário não pertence a um time' }, { status: 403 })
    }
    // Criar jogador
    const player = await prisma.player.create({
      data: {
        name,
        position,
        number: number ? Number(number) : null,
        photoUrl: photoUrl || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        status: status || 'ACTIVE',
        monthlyFee: monthlyFee ? Number(monthlyFee) : 0,
        isExempt: !!isExempt,
        teamId: teamUser.teamId
      }
    })
    return NextResponse.json(player, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar jogador:', error)
    return NextResponse.json({ error: 'Erro ao criar jogador' }, { status: 500 })
  }
}

// PUT e DELETE não são suportados nesta rota (usar rota /[id])
export async function PUT() {
  return NextResponse.json({ error: 'Use a rota /api/players/[id] para atualizar jogadores' }, { status: 405 })
}
export async function DELETE() {
  return NextResponse.json({ error: 'Use a rota /api/players/[id] para excluir jogadores' }, { status: 405 })
} 