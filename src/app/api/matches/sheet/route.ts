// Este arquivo foi desabilitado temporariamente
// O modelo matchSheet foi removido do schema atual
// Será reativado após o deploy funcionar

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// POST: Criar partida e gerar shareToken
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
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
      where: { shareToken },
      include: { events: true, team: true }
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
    const { shareToken, ourScore1, opponentScore1, ourScore2, opponentScore2, events } = data
    if (!shareToken) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }
    const match = await prisma.match.findFirst({ where: { shareToken } })
    if (!match) {
      return NextResponse.json({ error: 'Súmula não encontrada' }, { status: 404 })
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
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar súmula:', error)
    return NextResponse.json({ error: 'Erro ao atualizar súmula' }, { status: 500 })
  }
} 