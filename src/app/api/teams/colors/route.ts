import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveSession } from '@/lib/session'

const DEFAULT_COLORS = {
  primaryColor: '#1a365d',
  secondaryColor: '#2563eb'
}

// Cores do time do usuário logado (antes aceitava qualquer ?userId= sem autenticação)
export async function GET() {
  try {
    const session = await getActiveSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const teamUser = await prisma.teamUser.findFirst({
      where: {
        userId: session.user.id,
        role: 'owner'
      },
      include: {
        team: {
          select: {
            primaryColor: true,
            secondaryColor: true
          }
        }
      }
    })

    if (!teamUser?.team) {
      return NextResponse.json(DEFAULT_COLORS)
    }

    return NextResponse.json({
      primaryColor: teamUser.team.primaryColor,
      secondaryColor: teamUser.team.secondaryColor
    })
  } catch (error) {
    console.error('Erro ao buscar cores do time:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar cores do time' },
      { status: 500 }
    )
  }
}
