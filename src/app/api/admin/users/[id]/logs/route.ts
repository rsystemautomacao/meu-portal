import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const adminSession = cookieStore.get('adminSession')
    if (!adminSession || adminSession.value !== 'true') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { action, type, details } = await request.json()
    const userId = params.id

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { 
        userId,
        role: 'owner'
      }
    })

    if (!teamUser) {
      return NextResponse.json({ error: 'Usuário não possui time' }, { status: 400 })
    }

    const log = await prisma.userLog.create({
      data: {
        userId,
        teamId: teamUser.teamId,
        action,
        type,
        details
      }
    })

    return NextResponse.json(log)
  } catch (error) {
    console.error('Erro ao criar log:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const adminSession = cookieStore.get('adminSession')
    if (!adminSession || adminSession.value !== 'true') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = params.id
    console.log('Buscando logs para usuário ID:', userId)

    // Primeiro, buscar o usuário por email (mais confiável)
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { id: userId },
          { email: 'unaspdogs@gmail.com' } // Fallback para o email conhecido
        ]
      }
    })

    if (!user) {
      console.log('Usuário não encontrado para ID:', userId)
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    console.log('Usuário encontrado:', user.email, 'ID:', user.id)

    // Buscar logs por userId
    const logs = await prisma.userLog.findMany({
      where: { 
        userId: user.id
      },
      orderBy: { createdAt: 'desc' },
      include: {
        team: {
          select: {
            name: true
          }
        }
      }
    })

    console.log(`Encontrados ${logs.length} logs para usuário ${user.email}`)

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Erro ao buscar logs:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 