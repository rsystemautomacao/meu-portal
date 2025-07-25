import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    // Buscar o usuário e seu time
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        teams: {
          include: {
            team: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário tem um time
    const teamUser = user.teams[0]
    if (!teamUser) {
      return NextResponse.json({ error: 'Usuário não pertence a um time' }, { status: 404 })
    }

    const team = teamUser.team

    // Verificar se o time está bloqueado
    const isBlocked = team.status === 'BLOCKED' || team.status === 'OVERDUE'
    const isDeleted = !!team.deletedAt

    return NextResponse.json({
      isBlocked,
      isDeleted,
      teamStatus: team.status,
      teamName: team.name,
      canLogin: !isBlocked && !isDeleted
    })
  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 }
    )
  }
} 