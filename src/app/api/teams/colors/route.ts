import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { message: 'ID do usuário não fornecido' },
        { status: 400 }
      )
    }

    const teamUser = await prisma.teamUser.findFirst({
      where: {
        userId: userId,
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
      return NextResponse.json(
        {
          primaryColor: '#1a365d',
          secondaryColor: '#2563eb'
        }
      )
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