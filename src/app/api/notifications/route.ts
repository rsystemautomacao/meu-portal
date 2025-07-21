import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar notificações do time do usuário logado
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

    // Listar notificações do time
    const notifications = await (prisma as any).notification.findMany({
      where: { teamId: teamUser.teamId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Erro ao listar notificações:', error)
    return NextResponse.json({ error: 'Erro ao listar notificações' }, { status: 500 })
  }
}

// POST - Marcar notificação como lida
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { notificationId } = await request.json()
    if (!notificationId) {
      return NextResponse.json({ error: 'ID da notificação é obrigatório' }, { status: 400 })
    }

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      include: { team: true }
    })
    if (!teamUser) {
      return NextResponse.json({ error: 'Usuário não pertence a um time' }, { status: 403 })
    }

    // Marcar notificação como lida
    const notification = await (prisma as any).notification.update({
      where: { 
        id: notificationId,
        teamId: teamUser.teamId // Garantir que a notificação pertence ao time
      },
      data: { isRead: true }
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    return NextResponse.json({ error: 'Erro ao marcar notificação como lida' }, { status: 500 })
  }
} 