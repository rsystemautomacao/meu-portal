import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar partidas do time do usuário logado
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
    // Listar partidas do time
    const matches = await prisma.match.findMany({
      where: { teamId: teamUser.teamId },
      include: {
        events: true
      },
      orderBy: { date: 'desc' }
    })
    return NextResponse.json(matches)
  } catch (error) {
    console.error('Erro ao listar partidas:', error)
    return NextResponse.json({ error: 'Erro ao listar partidas' }, { status: 500 })
  }
}

// POST - Criar partida no time do usuário logado
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const data = await request.json()
    const { 
      date, 
      opponent, 
      location, 
      ourScore, 
      opponentScore,
      ourScore1,
      opponentScore1,
      ourScore2,
      opponentScore2,
      events = [] // Novo campo para eventos
    } = data
    if (!date || !opponent || !location) {
      return NextResponse.json({ error: 'Data, adversário e local são obrigatórios' }, { status: 400 })
    }
    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      include: { team: true }
    })
    if (!teamUser) {
      return NextResponse.json({ error: 'Usuário não pertence a um time' }, { status: 403 })
    }
    // Na criação da partida, não incluir o campo shareToken no objeto data, a menos que venha explicitamente em data.shareToken
    const matchData: any = {
      date: new Date(date),
      opponent,
      location,
      ourScore: ourScore !== undefined ? Number(ourScore) : 0,
      opponentScore: opponentScore !== undefined ? Number(opponentScore) : 0,
      ourScore1: ourScore1 !== undefined ? Number(ourScore1) : 0,
      opponentScore1: opponentScore1 !== undefined ? Number(opponentScore1) : 0,
      ourScore2: ourScore2 !== undefined ? Number(ourScore2) : 0,
      opponentScore2: opponentScore2 !== undefined ? Number(opponentScore2) : 0,
      teamId: teamUser.teamId,
      events: {
        create: events.map((event: any) => ({
          type: event.type,
          player: event.player,
          minute: event.minute,
          team: event.team,
          quadro: event.quadro,
          tempo: event.tempo,
          assist: event.assist,
          ...(typeof event.goleiro === 'string' ? { goleiro: event.goleiro } : {})
        }))
      }
    }
    if (data.shareToken) {
      matchData.shareToken = data.shareToken
    }
    // Se não houver shareToken, gerar um valor único para evitar erro de constraint
    if (!matchData.shareToken) {
      matchData.shareToken = 'manual-' + Date.now() + '-' + Math.floor(Math.random() * 1000000)
    }
    // Remover shareToken do objeto se for undefined, null ou string vazia
    if (!matchData.shareToken) {
      delete matchData.shareToken;
    }
    // Log para depuração
    console.log('[MATCH CREATE] Valor de shareToken recebido:', matchData.shareToken)
    const match = await prisma.match.create({
      data: matchData,
      include: {
        events: true
      }
    })
    return NextResponse.json(match, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar partida:', error)
    return NextResponse.json({ error: 'Erro ao criar partida' }, { status: 500 })
  }
}

// PUT e DELETE não são suportados nesta rota (usar rota /[id])
export async function PUT() {
  return NextResponse.json({ error: 'Use a rota /api/matches/[id] para atualizar partidas' }, { status: 405 })
}
export async function DELETE() {
  return NextResponse.json({ error: 'Use a rota /api/matches/[id] para excluir partidas' }, { status: 405 })
} 