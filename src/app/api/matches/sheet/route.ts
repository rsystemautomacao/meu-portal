import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { matchId } = await request.json()
    if (!matchId) {
      return NextResponse.json({ error: 'ID da partida é obrigatório' }, { status: 400 })
    }

    // Busca a partida
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { team: true }
    })

    if (!match) {
      return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 })
    }

    // Verifica se o usuário tem acesso ao time
    const hasAccess = await prisma.teamUser.findFirst({
      where: {
        userId: session.user.id,
        teamId: match.teamId
      }
    })

    if (!hasAccess) {
      return NextResponse.json({ error: 'Você não tem permissão para criar súmula para esta partida' }, { status: 403 })
    }

    // Verifica se já existe uma súmula para esta partida
    const existingSheet = await prisma.matchSheet.findUnique({
      where: { matchId }
    })

    if (existingSheet) {
      return NextResponse.json({ error: 'Já existe uma súmula para esta partida' }, { status: 400 })
    }

    // Gera um token único para compartilhamento
    const shareToken = randomBytes(32).toString('hex')

    // Cria a súmula
    const matchSheet = await prisma.matchSheet.create({
      data: {
        matchId,
        shareToken,
        status: 'pending'
      },
      include: {
        match: {
          include: {
            team: true
          }
        }
      }
    })

    return NextResponse.json(matchSheet)
  } catch (error) {
    console.error('Erro detalhado:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const shareToken = searchParams.get('shareToken')

    if (!shareToken) {
      return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 })
    }

    const matchSheet = await prisma.matchSheet.findFirst({
      where: { shareToken },
      include: {
        match: {
          include: {
            team: true
          }
        },
        events: {
          orderBy: {
            minute: 'asc'
          }
        }
      }
    })

    if (!matchSheet) {
      return NextResponse.json({ error: 'Súmula não encontrada' }, { status: 404 })
    }

    return NextResponse.json(matchSheet)
  } catch (error) {
    console.error('Erro detalhado:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { shareToken, status, startTime, endTime, firstHalfEnd, secondHalfStart } = await request.json()

    if (!shareToken) {
      return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 })
    }

    const matchSheet = await prisma.matchSheet.update({
      where: { shareToken },
      data: {
        ...(status && { status }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(firstHalfEnd && { firstHalfEnd }),
        ...(secondHalfStart && { secondHalfStart })
      }
    })

    return NextResponse.json(matchSheet)
  } catch (error) {
    console.error('Erro detalhado:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 