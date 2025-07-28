import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se é admin
    const cookieStore = cookies()
    const adminSession = cookieStore.get('adminSession')
    if (!adminSession || adminSession.value !== 'true') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const teamId = params.id

    // Buscar o usuário owner do time
    const teamUser = await prisma.teamUser.findFirst({
      where: { 
        teamId,
        role: 'owner'
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    })

    if (!teamUser) {
      return NextResponse.json({ error: 'Usuário owner não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      email: teamUser.user.email
    })
  } catch (error) {
    console.error('Erro ao buscar email do owner:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 