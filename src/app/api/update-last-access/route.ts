import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
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

    // Atualizar último acesso do time
    await prisma.team.update({
      where: { id: teamUser.teamId },
      data: { lastAccess: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar último acesso:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar último acesso' },
      { status: 500 }
    )
  }
} 