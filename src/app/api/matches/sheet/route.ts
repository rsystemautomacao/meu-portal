// Este arquivo foi desabilitado temporariamente
// O modelo matchSheet foi removido do schema atual
// Será reativado após o deploy funcionar

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveSession } from '@/lib/session'
import { randomBytes } from 'crypto'

const MAX_EVENTS = 500
const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i

// POST: Criar partida e gerar shareToken
export async function POST(request: NextRequest) {
  try {
    const session = await getActiveSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const data = await request.json()
    const { date, opponent, location } = data
    if (!date || !opponent || !location) {
      return NextResponse.json({ error: 'Data, adversário e local são obrigatórios' }, { status: 400 })
    }
    // Buscar time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      include: { team: true }
    })
    if (!teamUser) {
      return NextResponse.json({ error: 'Usuário não pertence a um time' }, { status: 403 })
    }
    // Gerar token único
    let shareToken: string
    let exists = true
    do {
      shareToken = randomBytes(8).toString('hex')
      exists = !!(await prisma.match.findFirst({ where: { shareToken } }))
    } while (exists)
    // Criar partida
    const match = await prisma.match.create({
      data: {
        date: new Date(date),
        opponent,
        location,
        ourScore: 0,
        opponentScore: 0,
        ourScore1: 0,
        opponentScore1: 0,
        ourScore2: 0,
        opponentScore2: 0,
        shareToken,
        teamId: teamUser.teamId
      }
    })
    return NextResponse.json({ shareToken, matchId: match.id })
  } catch (error) {
    console.error('Erro ao criar súmula:', error)
    return NextResponse.json({ error: 'Erro ao criar súmula' }, { status: 500 })
  }
}

// GET: Buscar partida por shareToken
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shareToken = searchParams.get('shareToken')
    if (!shareToken) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }
    const match = await prisma.match.findFirst({
      where: { shareToken: shareToken },
      include: {
        events: true,
        presences: {
          include: {
            // Link público: não expor mensalidade, nascimento etc.
            player: { select: { id: true, name: true, number: true, position: true } }
          }
        }
      }
    })
    if (!match) {
      return NextResponse.json({ error: 'Súmula não encontrada' }, { status: 404 })
    }
    const status = (match as any).status || 'open'
    if (status === 'completed' || status === 'expired') {
      return NextResponse.json({ error: 'Súmula já preenchida ou expirada' }, { status: 410 })
    }
    return NextResponse.json(match)
  } catch (error) {
    console.error('Erro ao buscar súmula:', error)
    return NextResponse.json({ error: 'Erro ao buscar súmula' }, { status: 500 })
  }
}

// PUT: Atualizar placares e eventos da partida
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { shareToken, ourScore1, opponentScore1, ourScore2, opponentScore2, events, quadro, presentes } = data
    if (!shareToken) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }
    const match = await prisma.match.findFirst({ where: { shareToken } })
    if (!match) {
      return NextResponse.json({ error: 'Súmula não encontrada' }, { status: 404 })
    }
    // Mesma regra do GET: súmula encerrada não aceita mais alterações pelo link público
    if (match.status === 'completed' || match.status === 'expired') {
      return NextResponse.json({ error: 'Súmula já preenchida ou expirada' }, { status: 410 })
    }
    if (Array.isArray(events) && events.length > MAX_EVENTS) {
      return NextResponse.json({ error: 'Número de eventos acima do permitido' }, { status: 400 })
    }
    if (quadro !== undefined && quadro !== null && quadro !== 1 && quadro !== 2) {
      return NextResponse.json({ error: 'Quadro inválido' }, { status: 400 })
    }
    // Atualizar placares
    await prisma.match.update({
      where: { id: match.id },
      data: {
        ourScore1: ourScore1 ?? match.ourScore1,
        opponentScore1: opponentScore1 ?? match.opponentScore1,
        ourScore2: ourScore2 ?? match.ourScore2,
        opponentScore2: opponentScore2 ?? match.opponentScore2
      }
    })
    // Tentar atualizar status via comando raw (MongoDB)
    try {
      // @ts-ignore
      await prisma.$runCommandRaw({
        update: 'Match',
        updates: [
          {
            q: { _id: match.id },
            u: { $set: { status: 'completed' } },
            upsert: false,
            multi: false
          }
        ]
      })
    } catch (e) {
      // Se não suportar, ignora
      console.warn('Não foi possível atualizar status via comando raw:', e)
    }
    // Atualizar eventos (opcional, sobrescreve todos)
    if (Array.isArray(events)) {
      // Deleta eventos antigos e cria novos
      await prisma.matchEvent.deleteMany({ where: { matchId: match.id } })
      for (const event of events) {
        await prisma.matchEvent.create({
          data: {
            matchId: match.id,
            type: event.type,
            player: event.player,
            minute: event.minute,
            team: event.team,
            quadro: event.quadro,
            tempo: event.tempo,
            assist: event.assist,
            ...(event.goleiro ? { goleiro: event.goleiro } : {})
          }
        })
      }
    }

    // Presença real do quadro finalizado (substitui só as presenças daquele quadro)
    if (quadro && Array.isArray(presentes)) {
      // Só aceita jogadores do próprio time da partida (o link é público)
      const requestedIds = presentes
        .map((p: any) => p?.playerId)
        .filter((id: unknown): id is string => typeof id === 'string' && OBJECT_ID_REGEX.test(id))
      const teamPlayers = requestedIds.length > 0
        ? await prisma.player.findMany({
            where: { teamId: match.teamId, id: { in: requestedIds } },
            select: { id: true }
          })
        : []

      await prisma.matchPresence.deleteMany({ where: { matchId: match.id, quadro } })
      if (teamPlayers.length > 0) {
        await prisma.matchPresence.createMany({
          data: teamPlayers.map((p) => ({
            matchId: match.id,
            playerId: p.id,
            quadro
          }))
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar súmula:', error)
    return NextResponse.json({ error: 'Erro ao atualizar súmula' }, { status: 500 })
  }
} 